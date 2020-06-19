"use strict";

$.fn.MegaJs = function (options = {}) {
    var Mega = class {
        constructor($nav, options = {}) {
            const self = this;
            this.settings = $.extend(
                {},
                {
                    items: "li", // Mega items, selector.
                    spacing: 10, // Spacing between Nav li and Mega menu, px
                    vertical: false, // vertical || horizontal
                    breakPoint: 991, // Mobile Break point, 768, 991
                    wrapper: false, // Can be `parent`, or jquery item, or selector default window.
                    megaSub: true, //
                    navText: "Menu", //
                    megaSubItems: "> ul, .dropdown-menu, .sub-menu",
                    closeIcon:
                        '<svg width="20" height="20" viewBox="0 0 20 20"><path fill="#000000" d="M10.707 10.5l5.646-5.646c0.195-0.195 0.195-0.512 0-0.707s-0.512-0.195-0.707 0l-5.646 5.646-5.646-5.646c-0.195-0.195-0.512-0.195-0.707 0s-0.195 0.512 0 0.707l5.646 5.646-5.646 5.646c-0.195 0.195-0.195 0.512 0 0.707 0.098 0.098 0.226 0.146 0.354 0.146s0.256-0.049 0.354-0.146l5.646-5.646 5.646 5.646c0.098 0.098 0.226 0.146 0.354 0.146s0.256-0.049 0.354-0.146c0.195-0.195 0.195-0.512 0-0.707l-5.646-5.646z"></path></svg>',
                },
                options
            );

            this.removeSubClass = self.settings.megaSubItems.replace(
                /[^a-z0-9\-_+]+/gi,
                " "
            );
            //console.log("this.removeSubClass", this.removeSubClass);
            this.activeClass = "mega-active";
            this.$NavMenu = $nav;
            this.NavRect = $nav.get(0).getBoundingClientRect();
            this.megaItems = [];
            this.isMobile = false;
            this.showing = false;
            this.timeOut = undefined;
            this.animation = ""; //Default animation: up
            this.animation = ""; //Default animation: up
            this.$wrapper = $.noop;
            this.verAlign = "right"; // mega position from Nav menu;
            this.$stickyEl = $.noop; // mega position from Nav menu;
            this.stickyType = ""; // Can be `fixed` or `sticky`
            this.isInstalled = false;
            this.touchSupport = false;

            this.headerHTML =
                '<div class="mega-header"><span class="mega-header-title"></span><div class="mega-close">' +
                this.settings.closeIcon +
                "</div></div>";

            this.arrowHTML =
                '<div class="mega-arr"><div class="mega-arr-inner"></div></div>';

            if ("ontouchstart" in document.documentElement) {
                this.touchSupport = true;
            }

            //console.log("Touch ", this.touchSupport);

            switch (this.settings.wrapper) {
                case "parent":
                    this.$wrapper = this.$NavMenu.parent();
                    break;
                default:
                    if (self.settings.wrapper) {
                        this.$wrapper = $(self.settings.wrapper);
                    } else {
                        //this.$wrapper = $("html");
                        this.$wrapper = this.$NavMenu.parent();
                    }
            }

            this.$NavMenu.addClass("mega-added");
            this.$NavMenu.addClass(
                this.settings.vertical
                    ? "mega-mod-vertical"
                    : "mega-mod-horizontal"
            );

            let navID = this.$NavMenu.attr("id") || "";
            if (!navID) {
                navID = "mega-" + new Date().getTime();
                self.$NavMenu.attr("id", navID);
            }

            this.$drop = $('<div class="mega-drop"/>');
            self.$drop.attr("id", navID + "-drop");

            if ( ! this.settings.vertical ) {
                this.$drop.insertAfter(this.$NavMenu);
            } else {
                $("body").append(this.$drop);
            }
            

            // Insert Mega menu header.
            let navHeaderTag =
                self.$NavMenu.prop("tagName") === "UL" ? "li" : "div";

            let $navHeader = self.$NavMenu.children(".mega-nav-header");

            // If nav header do not exist then add new.
            if (!$navHeader.length) {
                $navHeader = $(
                    "<" +
                        navHeaderTag +
                        ' class="mega-nav-header mega-header-auto mega-header"><span class="mega-header-title"></span><div class="mega-close">' +
                        self.settings.closeIcon +
                        "</div></" +
                        navHeaderTag +
                        ">"
                );

                $navHeader
                    .find(".mega-header-title")
                    .text(self.settings.navText);

                self.$NavMenu.prepend($navHeader);
            }

            // When click to main nav header close button on mobile mod then close Nav menu.
            $navHeader.on("click", ".mega-close", function (e) {
                e.preventDefault();
                self.$NavMenu.removeClass("mega-show");
                self.closeBG();
            });

            this.$drop.on("click.megajs", function () {
                // Close all mega items
                $.each(self.megaItems, function (index, item) {
                    self.closeMega(item, self.$drop);
                });
                self.closeBG();
            });

            this.firstInstall();

            this.checkStickyTypeNav();
            self.intMenu();

            var rtt = null;
            $(window).resize(function () {
                self.checkStickyTypeNav();
                self.intMenu();

                if (rtt) {
                    clearTimeout(rtt);
                }

                rtt = setTimeout(async function () {
                    self.detectNavAlign();
                   
                    $(window).off(".megajsScroll");
                    self.sleep(100);
                    self.detectDevice();
                    self.checkStickyTypeNav();
                    self.intMenu();
                    // console.log("Resize_Called");
                    self.initWindowResizeEvent();
                }, 500);
            });

            var stt = null;
            $(window).scroll(
                async function () {
                    if (stt) {
                        clearTimeout(stt);
                    }
                    stt = setTimeout(function () {
                        self.NavRect = $nav.get(0).getBoundingClientRect();
                        self.scrollTop = $(window).scrollTop();
                        self.navOffset = self.$NavMenu.offset();
                    }, 100);
                }.bind(this)
            );

            self.initWindowResizeEvent();
        }

        checkStickyTypeNav() {
            var self = this;
            let parent = this.$NavMenu;
            var tagName = "";
            var letDo = true;
            var maxDeep = 30;
            var i = 0;
            self.stickyType = "";
            self.$stickyEl = $.noop;

            do {
                i++;
                tagName = parent.prop("tagName");
                if (parent.css("position") === "fixed") {
                    letDo = false;
                    self.stickyType = "fixed";
                    self.$stickyEl = parent;
                }

                if (parent.css("position") === "sticky") {
                    letDo = false;
                    self.stickyType = "sticky";
                    self.$stickyEl = parent;
                }

                if ("BODY" === tagName) {
                    letDo = false;
                }

                if (i >= maxDeep) {
                    letDo = false;
                }

                if (letDo) {
                    parent = parent.parent();
                }
            } while (letDo);
        }

        async intMenu() {
            this.detectNavAlign();
            this.detectDevice();

            this.setupMenuItems();
        }

        sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        toInt(n, ndefault = null) {
            if (Number.isInteger(n)) {
                return n;
            }
            n = "" + n;
            if (n.length === 0) {
                return ndefault;
            }
            if (n.substring(n.length - 2) === "px") {
                n = n.substring(0, n.length - 2);
            }
            if (isFinite(n)) {
                return Number(n);
            }
            return ndefault;
        }

        detectNavAlign() {
            this.navAlign = this.$NavMenu.attr("data-align") || false;
            if (!this.navAlign) {
                var ta = this.$NavMenu.css("text-align");
                var jc = this.$NavMenu.css("justify-content");
                var d = this.$NavMenu.css("display");
                var ml = this.$NavMenu.css("margin-left");
                var mr = this.$NavMenu.css("margin-right");
                mr = this.toInt(mr);
                ml = this.toInt(ml);
                if (d === "flex") {
                    if (jc === "center") {
                        this.navAlign = "center";
                    }
                } else {
                    if (ta === "center" && Math.abs(mr - ml) < 20) {
                        this.navAlign = "center";
                    }
                }
            }

            if (!this.navAlign) {
                // check if is flex.
                //let $parent = this.$NavMenu.parent();
                let pRect = this.$wrapper.get(0).getBoundingClientRect();
                let navRect = this.$NavMenu.get(0).getBoundingClientRect();

                if (pRect.x + pRect.width / 2 < navRect.x + navRect.width / 2) {
                    this.navAlign = "right";
                } else {
                    this.navAlign = "left";
                }
            }

            // console.log("this.navAlign", this.navAlign);
        }

        detectDevice() {
            this.windowWidth = $(window).width();
            this.windowHeight = $(window).width();

            var rect = this.$wrapper.offset();
            var wh = this.$wrapper.height();
            var ww = this.$wrapper.width();

            this.verAlign = "";

            this.wrapperRect = {
                width: ww,
                height: wh,
                left: rect.left,
                right: rect.left + ww,
                top: rect.top,
            };

            if (this.settings.vertical) {
                // if (
                //     this.NavRect.x >
                //     this.wrapperRect.width / 2 + this.wrapperRect.left
                // ) {
                //     this.verAlign = "left";
                //     console.log("______LEFT", rect);
                // }


                if (
                    this.NavRect.x 
                    > this.windowWidth / 2
                ) {
                    this.verAlign = "left";
                    console.log("______LEFT", rect, ww );
                }


                // if (
                //     this.NavRect.x +
                //     this.wrapperRect.width / 2 <= self.windowWidth / 2
                // ) {
                //     this.verAlign = "right";
                //     console.log("______LEFT", rect);
                // } else {
                //     this.verAlign = "left";
                // }


            } else {
                // console.log("______RIGHT", rect);
            }

            this.isMobile = /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent
            );

            if (this.windowWidth <= this.settings.breakPoint) {
                this.isMobile = true;
            } else {
                this.isMobile = false;
            }

            // console.log("this.isMobile: ", this.isMobile);
        }

        getBorder($el) {
            return {
                top: this.toInt($el.css("border-top-width")),
                left: this.toInt($el.css("border-left-width")),
                right: this.toInt($el.css("border-right-width")),
                bottom: this.toInt($el.css("border-bottom-width")),
            };
        }

        getItemBase($mega, $navLi, id, megaId) {
            var self = this;
            var $arrow = $mega.find(".mega-arr");
            var $header = $mega.find(".mega-header");

            // Add arrow.
            if (!$arrow.length) {
                $arrow = $(self.arrowHTML);
                $mega.append($arrow);
            }

            //Add close button.
            if (!$header.length) {
                $header = $(self.headerHTML);
                $mega.prepend($header);
            }

            let text = $navLi.children("a").first().text();
            $header.children(".mega-header-title").text(text);

            var itemData = {
                id: id,
                megaId: megaId,
                $navLi: $navLi,
                $mega: $mega,
                $arrow: $arrow,
                $header: $header,
                animation: $mega.attr("data-animation") || self.animation,
                align: $mega.attr("data-align") || "auto",
                innerAlign: $mega.attr("data-inner-align") || "",
                dataWidth: $mega.attr("data-width") || "",
            };
            self.calcItemCSS(itemData);
            return itemData;
        }

        calcItemCSS(item) {
            var self = this;
            var megaItemRect = item.$mega.get(0).getBoundingClientRect();
            var megaItemWidth = self.toInt(item.$mega.outerWidth());
            var megaItemHeight = self.toInt(item.$mega.outerHeight());
            var arrowWidth = self.toInt(item.$arrow.width());
            var arrowHeight = self.toInt(item.$arrow.height());
            var liOffset = item.$navLi.offset();
            var liRect = item.$navLi.get(0).getBoundingClientRect();
            var border = self.getBorder(item.$mega);
            var megaBg = item.$mega.css("background-color");
            item.$arrow
                .find(".mega-arr-inner")
                .css({ "background-color": megaBg });
            item.center = {
                x: liOffset.left + item.$navLi.width() / 2,
                y: liOffset.top + item.$navLi.height() / 2,
            };
            item.border = border;
            item.liRect = liRect;
            item.liOffset = liOffset;
            item.megaItemRect = megaItemRect;
            item.megaItemWidth = megaItemWidth;
            item.megaItemHeight = megaItemHeight + border.top + border.bottom;
            item.arrowWidth = arrowWidth;
            item.arrowHeight = arrowHeight;
        }

        firstInstall() {
            let self = this;

            $(self.settings.items, self.$NavMenu).each(async function (index) {
                var navLi = $(this);
                var id = navLi.attr("id");

                var megaId = navLi.attr("data-mega") || "#m-" + id;
                var megaItem = $(megaId);
                if (!megaItem.length) {
                    // If support sub mega.
                    if (self.settings.megaSub && self.settings.megaSubItems) {
                        megaItem = navLi.children(self.settings.megaSubItems);

                        var megaId =
                            "mega-auto-" + index + "-" + new Date().getTime();
                        if (megaItem.length) {
                            // Add dropdown id and remove bootstrap  Toggle event.
                            navLi
                                .attr("data-mega", megaId)
                                .find("a")
                                .removeAttr("data-toggle")
                                .removeAttr("aria-expanded");
                        }

                        megaItem
                            .addClass("mega-nav-sub")
                            .removeClass(self.removeSubClass);
                        megaItem.wrap("<div></div>");
                        megaItem = megaItem.parent();
                        megaItem.wrapInner('<div class="mega-inner"></div>');
                        megaItem.attr("data-mega", megaId);
                    }

                    // Skip item if no mega content.
                    if (!megaItem.length) {
                        return;
                    }
                }

                megaItem.addClass("mega-wrapper");

                $("body").append(megaItem);
                megaItem.addClass("mi-" + index);
                megaItem.addClass(
                    "mega-" +
                        (self.settings.vertical ? "vertical" : "horizontal")
                );

                navLi.addClass("mega-enabled");

                var itemData = self.getItemBase(megaItem, navLi, id, megaId);
                self.megaItems.push(itemData);
            });
        }

        setupMenuItems() {
            let self = this;

            if (self.isMobile) {
                self.$NavMenu
                    .addClass("mega-mobile")
                    .removeClass("mega-desktop");
            } else {
                self.$NavMenu
                    .addClass("mega-desktop")
                    .removeClass("mega-mobile");
            }

            $.each(self.megaItems, async function (index, item) {
                if (self.isMobile) {
                    item.$mega
                        .addClass("mega-mobile")
                        .removeClass("mega-desktop");
                } else {
                    item.$mega
                        .addClass("mega-desktop")
                        .removeClass("mega-mobile");
                }

                item.$mega.css("width", "");

                if (item.$navLi.find(".mega-clip").length === 0) {
                    item.$navLi.append('<span class="mega-clip"></span>');
                }

                let mgWidth = '';

                var customMegaWidth = item.dataWidth;
                if (customMegaWidth === "full") {
                    mgWidth = self.windowWidth;
                } else if (customMegaWidth === "fit") {
                    if (self.$wrapper.length) {
                        mgWidth = self.$wrapper.innerWidth();
                    } else {
                        mgWidth = self.$NavMenu.outerWidth();
                    }
                } else if (customMegaWidth) {
                    mgWidth = customMegaWidth;
                } else {
                    mgWidth = '';
                }

                item.$mega.css("width", mgWidth );

                await self.sleep(50);

                self.calcItemCSS(item);

                if (self.settings.vertical) {
                    // AIM hover clip triangle.
                    item.$navLi.find(".mega-clip").css({
                        width: item.liRect.width + 100,
                        height: item.megaItemHeight + 100,
                    });
                    if (self.verAlign === "left") {
                        item.$arrow
                            .removeClass("arr-left")
                            .addClass("arr-right");
                        item.$navLi.addClass("mega-v-right");
                        item.$mega.addClass("mega-v-right");
                        self.setupMegaVerticalPositionLeft(item);
                    } else {
                        item.$arrow
                            .addClass("arr-left")
                            .removeClass("arr-right");
                        self.setupMegaVerticalPosition(item);
                    }
                } else {
                    // AIM hover clip triangle.
                    item.$navLi.find(".mega-clip").css({
                        width: self.NavRect.width,
                        height: 180 + self.settings.spacing,
                    });
                    self.setupMegaPosition(item);
                }

                if (self.isMobile) {
                    item.$mega.removeAttr("style");
                }

                self.initEvents(item);
            });
        }

        maybeSetUpMegaTop(item, top) {
            var self = this;
            if (!self.isMobile) {
                item.$mega.css({
                    top: top,
                });
            } else {
                item.$mega.css({
                    top: "",
                });
            }
        }

        maybeCheckItemStuck(item) {
            const self = this;
            let isStuck = false;
            if (self.stickyType) {
                let stickyTop = self.$stickyEl.css("top");
                if (stickyTop) {
                    stickyTop = self.toInt(stickyTop);
                    let stickyRect = self.$stickyEl
                        .get(0)
                        .getBoundingClientRect();
                    let isStuck = stickyTop === stickyRect.y;

                    $("body").toggleClass("mega-body-fixed", isStuck);
                    item.$mega.removeClass("mega-fixed");
                }
            }
            return isStuck;
        }

        async setupMegaPosition(item) {
            var self = this;

            self.calcItemCSS(item);
            var menuAlign = item.align;
            var top, left, right, arl, art;
            var st = item.$navLi.offset().top;
            let isStuck = false;

            // Check if is __sticky
            isStuck = self.maybeCheckItemStuck(item);

            if (isStuck) {
                st = item.$navLi.position().top;
                item.$mega.addClass("mega-fixed");
            }

            top = st + item.$navLi.outerHeight() + self.settings.spacing;
            if ("full" === item.dataWidth) {
                left = 0;
            } else if ("fit" === item.dataWidth) {
                if (self.$wrapper.length) {
                    left = self.$wrapper.get(0).getBoundingClientRect().x;
                } else {
                    left = self.$NavMenu.get(0).getBoundingClientRect().x;
                }
                // console.log("here__fit #" + item.id);
            } else {
                // console.log("MEGA_ #" + item.megaId, menuAlign, self.navAlign);
                switch (menuAlign) {
                    case "left":
                        left = item.liRect.x;
                        // Check if mega pos right outside window.
                        if (
                            left + item.megaItemWidth >
                            self.wrapperRect.right
                        ) {
                            left =
                                (self.wrapperRect.right - item.megaItemWidth) /
                                2;
                        }
                        break;
                    case "right": // Align right.
                        left = item.liRect.x + item.liRect.width;
                        left = left - item.megaItemWidth;
                        // Check if mega pos left outside window.
                        if (left < self.wrapperRect.left) {
                            left = self.wrapperRect.left;
                        }

                        break;
                    default:
                        // Center
                        // Align auto.
                        left =
                            item.liRect.x +
                            item.liRect.width / 2 -
                            item.megaItemWidth / 2;

                        if (left < self.NavRect.x) {
                            // console.log("LEft: #" + item.id, left);
                            left = self.NavRect.x;
                        }

                        // Check if mega pos right outside window.
                        if (
                            left + item.megaItemWidth >
                            self.wrapperRect.right
                        ) {
                            // console.log("LEft 2: #" + item.id, left);
                            left = self.wrapperRect.right - item.megaItemWidth;
                        }

                        if (self.navAlign === "center") {
                            right =
                                self.wrapperRect.right -
                                (left + item.megaItemWidth);
                            var d = (left + right) / 2; // make it center.
                            if (
                                d < item.center.x &&
                                // d + (item.center.x - left) < item.center.x &&
                                d + item.megaItemWidth >= item.center.x
                            ) {
                                left = d;
                            }
                        }

                        // Check left with li center
                        if (
                            left + item.megaItemWidth <
                            item.liRect.x + item.liRect.width
                        ) {
                            console.log("MEGA_CCC #" + item.megaId, left);
                            left +=
                                item.liRect.x +
                                item.liRect.width -
                                (left + item.megaItemWidth);
                        }

                        // Center mega item if it translateX to left.
                        if (
                            item.megaItemWidth >= self.NavRect.width &&
                            left + item.megaItemWidth / 2 <
                                self.windowWidth / 2 &&
                            left + item.megaItemWidth > item.center.x &&
                            left < item.liRect.x
                        ) {
                            // console.log("MEGA_CCC #" + item.megaId, left);
                            left = (self.windowWidth - item.megaItemWidth) / 2;
                        }

                    // Check right with li center
                    // if ( left + item.megaItemWidth < item.liRect.x + item.liRect.width ) {
                    //     console.log( 'MEGA_CCC #'+ item.megaId, left );
                    //     left += ( item.liRect.x + item.liRect.width ) - ( left + item.megaItemWidth  );
                    // }
                }
            } // end if item align.

            // Arrow position.
            arl =
                Math.abs(left - item.liRect.x) +
                item.liRect.width / 2 -
                item.arrowWidth / 2 -
                item.border.top / 2 -
                1;
            art = -(item.arrowHeight - item.border.top * 2);
            if (arl <= 0) {
                arl = 0;
            }

            if (item.border.top === 0) {
                // console.log("item.border.top", item.border.top);
                art -= 4;
            }

            // Arrow position
            item.arrowPos = { left: arl, top: art };
            item.megaPos = { left: left, top: top };
            item.relativeX =
                Math.abs(left - item.liRect.x) + item.liRect.width / 2;

            // console.log("Item Setup DEFAULT #" + item.id, item);
            self.maybeSetUpMegaTop(item, top);
            //  await self.sleep( 20 );
        }

        setupMegaVerticalPosition(item) {
            
            var self = this;
            self.calcItemCSS(item);

            // console.log("Item Vertical #" + item.id, item);

            var top, left, right, arl, art;
            top = item.$navLi.offset().top - item.border.top;
            left =
                self.$NavMenu.offset().left +
                self.NavRect.width +
                self.settings.spacing;
            if (
                left + item.megaItemWidth >
                self.wrapperRect.right - self.settings.spacing
            ) {
                // console.log("Item Vertical_____ #" + item.id, item);
                item.megaItemWidth =
                    self.wrapperRect.right +
                    item.border.right +
                    item.border.left -
                    left;
            }

            // Auto top
            if (
                top +
                    item.megaItemHeight -
                    (self.$NavMenu.offset().top + self.NavRect.height) >
                0
            ) {
                var tt =
                    top +
                    item.megaItemHeight -
                    (self.$NavMenu.offset().top + self.NavRect.height);
                top -= tt;
            }

            if (
                top + item.megaItemHeight <
                self.$NavMenu.offset().top + self.NavRect.height
            ) {
                top -= self.$NavMenu.offset().top;
                self.NavRect.height - (top + item.megaItemHeight);
            }

            if (top < self.$NavMenu.offset().top) {
                top = self.$NavMenu.offset().top;
            }

            // Arrow position.
            arl =
                Math.abs(left - item.liRect.x) +
                item.liRect.width / 2 -
                item.arrowWidth / 2 -
                item.border.top / 2 -
                1;

            art =
                Math.abs(top - item.$navLi.offset().top) +
                item.$navLi.height() / 2;
            if (art <= 0) {
                art = 0;
            }

            // Arrow position
            item.arrowPos = { left: arl, top: art };
            item.megaPos = { left: left, top: top };
            item.relativeX =
                Math.abs(left - item.liRect.x) + item.liRect.width / 2;

            // console.log("Item Setup VER #" + item.id, item);

            self.maybeSetUpMegaTop(item, top);
        }

        async setupMegaVerticalPositionLeft(item) {
           
            var self = this;
            self.calcItemCSS(item);
            // console.log("Item Vertical LEFT #" + item.id, item);
            var top, left, right, arl, art;
            top = item.$navLi.offset().top - item.border.top;
            left =
                self.NavRect.x -
                item.megaItemWidth -
                self.settings.spacing -
                self.wrapperRect.left;
            if (left < self.wrapperRect.left) {
                left = self.wrapperRect.left;
            }

            if (
                left + item.megaItemWidth + self.settings.spacing >
                self.NavRect.x
            ) {
                item.megaItemWidth =
                    self.NavRect.x - left - self.settings.spacing;
            } else {
                left =
                    self.NavRect.x - item.megaItemWidth - self.settings.spacing;
            }

            // Auto top
            if (
                top +
                    item.megaItemHeight -
                    (self.$NavMenu.offset().top + self.NavRect.height) >
                0
            ) {
                var tt =
                    top +
                    item.megaItemHeight -
                    (self.$NavMenu.offset().top + self.NavRect.height);
                top -= tt;
            }

            if (
                top + item.megaItemHeight <
                self.$NavMenu.offset().top + self.NavRect.height
            ) {
                top -=
                    self.$NavMenu.offset().top +
                    self.NavRect.height -
                    (top + item.megaItemHeight);
            }

            if (top < self.$NavMenu.offset().top) {
                top = self.$NavMenu.offset().top;
            }

            // Arrow position.
            arl =
                Math.abs(left - item.liRect.x) +
                item.liRect.width / 2 -
                item.arrowWidth / 2 -
                item.border.top / 2 -
                1;
            art =
                Math.abs(top - item.$navLi.offset().top) +
                item.$navLi.height() / 2;
            if (art <= 0) {
                art = 0;
            }

            // Arrow position
            item.arrowPos = { left: arl, top: art };
            item.megaPos = { left: left, top: top };
            item.relativeX =
                Math.abs(left - item.liRect.x) + item.liRect.width / 2;

            // console.log("Item Setup LEFT #" + item.id, item);
           

            self.maybeSetUpMegaTop(item, top);
        }

        setupLayoutItem(item) {
            var self = this;
            item.liRect = item.$navLi.get(0).getBoundingClientRect();

            if (!self.isMobile) {
                if (self.settings.vertical) {
                    item.$arrow.css({
                        top: item.arrowPos.top,
                    });
                } else {
                    item.$arrow.css({
                        //top: item.arrowPos.top,
                        left: item.arrowPos.left,
                    });
                }

                item.$mega.css({
                    width: item.megaItemWidth,
                    // height: item.megaItemHeight,
                    top: item.megaPos.top,
                    left: item.megaPos.left,
                });

                // Inner Align
                if (!self.settings.vertical && item.innerAlign === "auto") {
                    var $inner = item.$mega.find("> .mega-inner");
                    var iw = $inner.outerWidth();
                    if (
                        iw <
                        item.megaItemWidth -
                            (item.border.left + item.border.right)
                    ) {
                        var ml =
                            item.relativeX -
                            iw / 2 -
                            item.border.left -
                            item.border.right;
                        if (ml >= 0) {
                            if (ml + iw > item.megaItemWidth) {
                                var d =
                                    ml +
                                    iw +
                                    (item.border.left + item.border.right) -
                                    item.megaItemWidth;
                                ml -= d;
                            }
                            $inner.css({
                                marginLeft: ml,
                            });
                        }
                    }
                }
            }
        }

        eventClickNavLiItem(item) {
            var self = this;
            return async function (event) {
                event.preventDefault();
                if (!self.isMobile) {
                    if (!self.showing) {
                        // self.$bg.addClass("mega-init");
                    } else {
                        // self.$bg.removeClass("mega-init");
                    }
                    self.showing = true;
                }

                self.setupPositionForMegaMode(item);

                item.$mega.css( { width: item.megaItemWidth } );

                // console.log("hover #", item.id);

                item.$navLi.addClass(self.activeClass);
                item.$mega.addClass(self.activeClass);

                if (self.isMobile) {
                    $("body").addClass("mega-mobile-activated");
                    self.$drop.addClass("drop-activated");
                } else {
                    $("body").addClass("mega-desktop-activated");
                    if (self.stickyType) {
                        //  $("body").addClass("mega-body-fixed");
                    }
                }
                //console.log("showing", item.$navLi);
            };
        }

        eventNavLiOut(item) {
            var self = this;
            return function (e) {
                // Khi chuot ra khỏi mega menu li

                var goingto = e.relatedTarget || e.toElement;
                var $goingto = $(goingto);
                console.log("ITEM OUT: ", $goingto);
                if (
                    !$goingto.is(item.$navLi) &&
                    !$goingto.is(item.$navLi) &&
                    !$goingto.is(item.$mega) &&
                    item.$mega.has($goingto).length === 0
                ) {
                    // console.log("Out0: #" + item.id);
                    self.closeMega(item, $goingto, e);
                    if (
                        //!$goingto.is(".mega-enabled") &&
                        !$goingto.is(item.$mega) &&
                        item.$mega.has($goingto).length === 0
                    ) {
                        setTimeout(function () {
                            // console.log("LeaveBG: #" + item.id);
                            if (
                                self.$NavMenu.find("." + self.activeClass)
                                    .length === 0
                            ) {
                                self.closeBG();
                            }
                        }, 30);
                    }
                } else {
                    // console.log("Out1: #" + item.id);
                    if (
                        !$goingto.is(item.$mega) &&
                        item.$mega.has($goingto).length === 0
                    ) {
                        // console.log("Out2: #" + item.id);
                        self.closeBG();
                    }
                }

                if (item.timeoutClose) {
                    clearTimeout(item.timeoutClose);
                }
                item.timeoutClose = setTimeout(function () {
                    // console.log("Reset_Set_when_Close_LI");
                    self.setupPositionForMegaMode(item);
                }, 350);
            };
        }

        eventMegaOut(item) {
            var self = this;

            return function (e) {
                //  Khi chuot ra khỏi mega menu megaItem

                var goingto = e.relatedTarget || e.toElement;
                var $goingto = $(goingto);
                // console.log("MEGA OUT: #" + item.id, $goingto);
                if (!$goingto.is(item.$mega) && !$goingto.is(item.$navLi)) {
                    self.closeMega(item, $goingto, e);
                }

                if (!$goingto.is(".mega-enabled")) {
                    self.closeBG();
                }

                if (item.timeoutClose) {
                    clearTimeout(item.timeoutClose);
                }
                item.timeoutClose = setTimeout(function () {
                    // console.log("Reset_Set_when_MEGA_OUT");
                    self.setupPositionForMegaMode(item);
                }, 350);
            };
        }

        async setupPositionForMegaMode(item) {
            var self = this;
            if (self.settings.vertical) {
                if (self.verAlign === "left") {
                    self.setupMegaVerticalPositionLeft(item);
                } else {
                    self.setupMegaVerticalPosition(item);
                }
            } else {
                await self.setupMegaPosition(item);
            }
        }

        eventScroll(item) {
            var self = this;
            return async function () {
                if (item._stt) {
                    clearTimeout(item._stt);
                }
                if (item._stt2) {
                    clearTimeout(item._stt2);
                }
                item.$mega.addClass("no-animate");
                item._stt = setTimeout(function () {
                    self.setupLayoutItem(item);
                    // console.log("RESET_POST_WHEN_REST #" + item.id);
                    self.setupPositionForMegaMode(item);
                    item._stt2 = setTimeout(function () {
                        item.$mega.removeClass("no-animate");
                    }, 30);
                }, 30);
            };
        }

        initWindowResizeEvent() {
            var self = this;
            $.each(self.megaItems, async function (index, item) {
                $(window).on("scroll.megajsScroll", self.eventScroll(item));
            });
        }

        initEvents(item) {
            const self = this;
            if (self.isInstalled) {
                return;
            }

            item.$navLi.off(".megajs");
            item.$mega.off(".megajs");
            item.$header.off(".megajs");

            self.setupLayoutItem(item);

            if (!self.isMobile) {
                item.$navLi.on(
                    "mouseover.megajs",
                    self.eventClickNavLiItem(item)
                );
                item.$navLi.on("mouseleave.megajs", self.eventNavLiOut(item));
                item.$mega.on("mouseleave.megajs", self.eventMegaOut(item));
            } else {
                // Mobile
                item.$navLi.on(
                    "click.megajs touchstart.megajs",
                    self.eventClickNavLiItem(item)
                );
            } // end check mobile or desktop

            item.$header.on("click.megajs", function (e) {
                self.closeMega(item);
            });
        }

        closeMega(item, $goingto = null, e = null) {
            var self = this;
            // console.log("CLose OUT: #" + item.id);
            item.$mega.removeClass(self.activeClass);
            item.$navLi
                .removeClass(self.activeClass)
                .removeClass("show")
                .find("a")
                .attr("aria-expanded", "false");

            if (!self.$NavMenu.hasClass("mega-show")) {
                self.$drop.removeClass("drop-activated");
            }

            if (self.isMobile) {
                //self.closeBG();
            }
        }

        closeBG() {
            const self = this;
            // self.$bg.removeClass("mega-active mega-init");
            self.showing = false;
            self.$NavMenu.removeClass("mega-show");
            self.$drop.removeClass("drop-activated");
            $("body").removeClass(
                "mega-desktop-activated mega-mobile-activated mega-body-fixed"
            );
        }
    };

    return this.each(function () {
        // Do something to each element here.
        new Mega($(this), options);
    });
};

jQuery(document).ready(function ($) {
    $(document).on("click", ".mega-mobile-toggle", function (e) {
        e.preventDefault();
        var tg = $(this).attr("data-target") || false;
        if (tg) {
            let $tg = $(tg);
            if ($tg.hasClass("mega-show")) {
                $tg.removeClass("mega-show");
                $("body").removeClass("mega-mobile-activated");
                $(tg + "-drop").removeClass("drop-activated");
            } else {
                $tg.addClass("mega-show");
                $(tg + "-drop").addClass("drop-activated");
                $("body").addClass("mega-mobile-activated");
            }
        }
    });
});

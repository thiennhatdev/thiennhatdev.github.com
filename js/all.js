

$(document).ready(function () {
    let count = 0;
    $('#select-field').click(() => {

        if (!count) {
            $('#list-field').css('display', 'block');
            count = 1;
        } else {
            $('#list-field').css('display', 'none');
            count = 0;
        }


    });

    selectField = (e) => {
        $('#showField').text(e.target.innerText)
    }

    var textAreas = document.getElementsByTagName('textarea');

    Array.prototype.forEach.call(textAreas, function (elem) {
        elem.placeholder = elem.placeholder.replace(/\\n/g, '\n');
    });

    // show menu 576px
    let iconHidden = 0;
    $('.icon-hidden').click(() => {
        if (!iconHidden) {
            $('.icon-hidden span:nth-child(1)').css('transform', 'rotate(46deg) translate(1px, 6px)');
      $('.icon-hidden span:nth-child(3)').css('transform', 'rotate(-231deg) translate(1px, 5px)');
      $('.icon-hidden span:nth-child(2)').css('display', 'none');
      $('nav ul').css('display', 'block');
            iconHidden = 1;
        } else {
            iconHidden = 0;
            $('.icon-hidden span:nth-child(1)').css('transform', 'rotate(0) translate(0)');
      $('.icon-hidden span:nth-child(3)').css('transform', 'rotate(0) translate(0)');
      $('.icon-hidden span:nth-child(2)').css('display', 'block');
      $('nav ul').css('display', 'none');
        }
        
    })

});
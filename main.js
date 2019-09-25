var myMap;

ymaps.ready(init);

var coordsArray = [];

function init() {
  myMap = new ymaps.Map("map", {
    center: [48.48, 135.10],
    zoom: 13,
    controls: ['zoomControl', 'searchControl']
  });

  var myPlacemark;

  myMap.cursors.push('arrow');
  
  var myBalloonContentBodyLayout = ymaps.templateLayoutFactory.createClass(
    '<div class="review-popup">' +
      '<div class="review-popup__header">{{ properties.address }}</div>' +
      '<a class="close" href="#">&times;</a>' +
      '<div class="review-popup__reviews">' +
        '<div class="reviews-content">' +
          '<div class="review-item">{{ properties.name }}</div>' +
          '<div class="review-item time">{{ properties.time }}</div>' +
          '<div class="review-item place">{{ properties.place }}</div>' +
          '<div class="review-item comment">{{ properties.comment }}</div>' +
        '</div>' +
      '</div>' +
      '<form action="" id="review-info">' +
        '<h4 class="form-name">ВАШ ОТЗЫВ</h4>' +
        '<input type="text" id="name" class="form-review__name form-field" placeholder="Ваше имя">' +
        '<input type="text" id="place" class="form-review__adress form-field" placeholder="Укажите место">' +
        '<textarea class="form-review__text form-field" id="comment" name="comment" placeholder="Поделитесь впечатлениями"></textarea>' +
        '<button type="submit" id="form-submit__button">Добавить</button>' +
      '</form>' +
    '</div>', {
      build: function () {
        myBalloonContentBodyLayout.superclass.build.call(this);
        $('#form-submit__button').bind('click', this.onCounterClick);
        var closeButton = document.querySelector('.close');
        closeButton.addEventListener('click', (e) => {
          e.preventDefault();
          var balloon = document.querySelector('.review-popup');
          balloon.parentNode.removeChild(balloon);
        });
      },
      clear: function () {
        $('#form-submit__button').unbind('click', this.onCounterClick);
        myBalloonContentBodyLayout.superclass.clear.call(this);
      },
      onCounterClick: function (event) {
        event.preventDefault();
        var nameInput = document.getElementById('name');
        var placeInput = document.getElementById('place');
        var commentInput = document.getElementById('comment');
        var coordinates = myPlacemark.geometry.getCoordinates().map((value) => {
          return value.toFixed(6);
        });
        
        ymaps.geocode(coordinates).then(function(res) {
          var geoObject = res.geoObjects.get(0);
    
            return geoObject.getAddressLine();
        }).then((result) => {
          sendInfo(result);
        });

        function sendInfo(address) {
          var review = {
            address: address,
            coords: coordinates,
            name: nameInput.value,
            place: placeInput.value,
            comment: commentInput.value,
            time: new Date().toLocaleString()
          };
  
          if (localStorage.length) {
            for (let i = 0; i < localStorage.length; i++) {
              if (review.coords == localStorage.key(i)) {
                let storageArray = JSON.parse(localStorage.getItem(localStorage.key(i)));
                storageArray.push(review);
  
                return localStorage.setItem(review.coords, JSON.stringify(storageArray));
              }
            }
  
            localStorage.setItem(review.coords, JSON.stringify([review]));
          } else {
            localStorage.setItem(review.coords, JSON.stringify([review]));
          }
  
          nameInput.value = '';
          placeInput.value = '';
          commentInput.value = ''
        }
      }
  });

  var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
    // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
    '<h2 class=ballon_header>{{ properties.place }}</h2>' +
      '<div class=ballon_body><a href="#">{{ properties.address }}</a></div>' +
      '<div class=ballon_footer>{{ properties.comment }}</div>'
  );

  var clusterer = new ymaps.Clusterer({
    clusterDisableClickZoom: true,
    clusterOpenBalloonOnClick: true,
    clusterBalloonContentLayout: 'cluster#balloonCarousel',
    clusterBalloonItemContentLayout: customItemContentLayout,
    clusterBalloonPanelMaxMapArea: 0,
    clusterBalloonContentLayoutWidth: 200,
    clusterBalloonContentLayoutHeight: 130,
    clusterBalloonPagerSize: 5
  });
  
  var placemarks = [];
  for (let i = 0; i < localStorage.length; i++) {
    var placeMarkContent = JSON.parse(localStorage.getItem(localStorage.key(i)));
    for (let k = 0; k < placeMarkContent.length; k++) {
      var placemark = createPlacemark(localStorage.key(i).split(','));
      placemark.properties.set({
        address: placeMarkContent[k].address,
        coords: placeMarkContent[k].coords,
        name: placeMarkContent[k].name,
        place: placeMarkContent[k].place,
        comment: placeMarkContent[k].comment,
        time: placeMarkContent[k].time
      });
      placemarks.push(placemark);
    }
  }
  
  clusterer.add(placemarks);
  myMap.geoObjects.add(clusterer);

  myMap.events.add('click', function (e) {
    var coords = e.get('coords');

    if (myPlacemark) {
      myPlacemark.geometry.setCoordinates(coords);
    } else {
      myPlacemark = createPlacemark(coords);
      myMap.geoObjects.add(myPlacemark);
    }

    ymaps.geocode(coords).then(function (res) {
      var geoObject = res.geoObjects.get(0);

      myPlacemark.properties.set({
        address: geoObject.getAddressLine()
      });
    });
  });

  function createPlacemark(coords) {
    return new ymaps.Placemark(coords, {
      address: '',
      coords: '',
      name: '',
      place: '',
      comment: '',
      time: '',
    }, {
      balloonLayout: myBalloonContentBodyLayout,
      balloonPanelMaxMapArea: 0,
      iconLayout: 'default#image',
    });
  }
}
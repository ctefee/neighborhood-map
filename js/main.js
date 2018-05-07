'use strict';

let popupWindow;
let map;
const FOUR_SQUARE_CLIENT_ID = 'N4GXUSOOC5OGI2EEDC4DVBKHDHE5XFPB4WAZH3GLKIEEZ1XK'; // ??
const FOUR_SQUARE_CLIENT_SECRET = 'B3JFZGQILMCZFU40OVL2AF0ESI1IUT5WV312GLLYHUKHZJHV'; //??
let mapRectangle;

/* Model Data */
let landmarks = [{
    title: 'Union Square Park',
    position: {
      lat: 40.735916,
      lng: -73.990574
    }
  },
  {
    title: 'Washington Square Park',
    position: {
      lat: 40.730890,
      lng: -73.997668
    }
  },
  {
    title: 'Madison Square Park',
    position: {
      lat: 40.742501,
      lng: -73.988127
    }
  },
  {
    title: 'Tompkins Square Park',
    position: {
      lat: 40.726540,
      lng: -73.981812
    }
  },
  {
    title: 'Gramercy Park',
    position: {
      lat: 40.738061,
      lng: -73.986080
    }
  }
];

// asynchronous google maps init function that loads and initializes the map
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: {
      lat: 40.735916,
      lng: -73.990574
    }
  });
  popupWindow = new google.maps.InfoWindow();
  mapRectangle = new google.maps.LatLngBounds();
  ko.applyBindings(new ViewModel());
}


/* create the Marker object and populate it with data from Foursquare */
let Marker = function(location) {
  let self = this;
  self.title = location.title;
  self.position = location.position;
  self.visible = ko.observable(true);
  self.street = 'Pending search...';
  self.city = 'Pending search...';

  // make a synchronous call to foursquare
  // it has to be synchronous because it populates properties later used by the Marker object
  let fourSquare = 'https://api.foursquare.com/v2/venues/search?ll=' + self.position.lat + ',' + self.position.lng + '&client_id=' + FOUR_SQUARE_CLIENT_ID + '&client_secret=' + FOUR_SQUARE_CLIENT_SECRET + '&v=20160118';

  $.ajax({
    url: fourSquare,
    dataType: 'json',
    async: false
  }).done(
    function(data) {
      var results = data.response.venues[0];
      self.street = results.location.formattedAddress[0];
      self.city = results.location.formattedAddress[1];
    }).fail(function(data) {
    alert('Error connecting to FourSquare');
  });

  // Create a marker per location and populate it with data
  self.marker = new google.maps.Marker({
    position: self.position,
    title: self.title,
    street: self.street,
    city: self.city
  });

  // use a computed observable here to set the visible marker
  self.filterMarkers = ko.computed(function() {
    if (self.visible() === true) {
      self.marker.setMap(map);
      mapRectangle.extend(self.marker.position);
      map.fitBounds(mapRectangle);
    } else {
      self.marker.setMap(null);
    }
  });
  // add listener for the onclick event which will populate the info window and pan to the location on the map
  self.marker.addListener('click', function() {
    populatePopupWindow(this);
    map.panTo(this.getPosition());
  });

  // popup landmark information when the item is clicked
  self.popupInfo = function(location) {
    google.maps.event.trigger(self.marker, 'click');
  };

};


// Knockout View Model
let ViewModel = function() {
  let self = this;
  self.searchItem = ko.observable('');
  self.mapList = ko.observableArray([]);

  // add location markers for each location
  landmarks.forEach(function(location) {
    self.mapList.push(new Marker(location));
  });

  self.positions = ko.computed(function() {
    // do searching
    let searchFilter = self.searchItem().toLowerCase();
    if (searchFilter) {
      return ko.utils.arrayFilter(self.mapList(), function(location) {
        let str = location.title.toLowerCase();
        let result = str.includes(searchFilter);
        location.visible(result);
        return result;
      });
    }
    // set each location visible in landmarks
    self.mapList().forEach(function(location) {
      location.visible(true);
    });
    return self.mapList();
  }, self);

};

/* populate the information popup window with data such as name, street and city */
/* this popup will be displayed when a marker is clicked */
function populatePopupWindow(marker) {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function() {
    marker.setAnimation(null);
  }, 1000);

  let content = '<div><span class="popupHeading">' + marker.title + '</span><div>' + marker.street + '</div><div>' + marker.city + '</div></div>';
  popupWindow.setContent(content);
  popupWindow.open(map, marker);
}

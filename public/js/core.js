function MainController($scope, $http, $interval, $timeout) {
  // Base URL for API calls.
  var baseURL = 'http://localhost:8080/api/';
  // Translation arrays for weather icons.
  var weatherIcons = {'01d':'1', '01n':'2', '02d':'H', '02n':'I', '03d':'N', '03n':'N', '04d':'Y', '04n':'Y','09d':'R', '09n':'R', '10d':'Q', '10n':'Q', '11d':'P', '11n':'P', '13d':'W', '13n':'W', '50d':'M'};

  // Element initializations
  setNow();
  setWeather();
  setDepartures();
  getTweets();
  setSchedule();

  // Interval initializations
  $interval(setNow, 60*1000)
  $interval(setWeather, 30*60*1000);
  $interval(setDepartures, 10*60*1000);
  $interval(getTweets, 30*60*1000);
  $interval(setTweet, 30*1000);
  $interval(setSchedule, 24*60*60*1000);

  // Function declarations
  function setNow() {
    $scope.now = Date.now();
  }

  function setWeather() {
    $http.get(baseURL + 'weather')
      .success(function(weather) {
        $scope.weather = weather;
        $scope.weatherIcon = weatherIcons[weather.weather[0].icon];
      })
      .error(function(error) {
        console.error(error);
      });
  }

  function setDepartures() {
    $http.get(baseURL + 'departureBoard')
      .success(function(departures) {
        $scope.departures = departures;
      })
      .error(function(error) {
        console.error(error);
      });
  }

  function getTweets() {
    $http.get(baseURL + 'tweets')
      .success(function(tweets) {
        $scope.tweets = tweets;
        setTweet();
      })
      .error(function(error) {
        console.error(error);
      });
  }

  function setTweet() {
    angular.element(document.getElementById("tweet")).removeClass("slideInRight").addClass("slideOutLeft");
    $scope.tweet = $scope.tweets.splice(0, 1)[0];
    $timeout(function() {
      angular.element(document.getElementById("tweet")).removeClass("slideOutLeft").addClass("slideInRight");
    }, 1000);
  }

  function setSchedule() {
    $http.get(baseURL + 'schedule')
      .success(function(schedule) {
          $scope.schedule = schedule;
      })
      .error(function(error) {
          $scope.schedule = error;
      });
  }
}

angular.module('mm', []).controller('MainController', ['$scope', '$http', '$interval', '$timeout', MainController]);
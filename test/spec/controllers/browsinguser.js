'use strict';

describe('Controller: BrowsinguserCtrl', function () {

  // load the controller's module
  beforeEach(module('playlistApp'));

  var BrowsinguserCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BrowsinguserCtrl = $controller('BrowsingUserCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

 
});

/*
 * #%L
 * ACS AEM Commons Bundle
 * %%
 * Copyright (C) 2015 Adobe
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

/*global angular: false, moment: false, JSON: false, difflib: false, diffview: false, console: false */

angular.module('acs-commons-jcr-checksum-compare-app', ['acsCoral', 'ACS.Commons.notifications'])
    .controller('MainCtrl', ['$scope', '$http', '$timeout', 'NotificationsService',
        function ($scope, $http, $timeout, NotificationsService) {

            $scope.app = {
                servlet: '/bin/acs-commons/jcr-compare.hashes.txt',
                hostNames: [],
                running: false
            };

            $scope.form = {
                path: '/content/geometrixx/en/products',
            };

            $scope.hosts = [{
                name: 'Localhost',
                uri: '',
                data: '',
                active: true
            }];

            $scope.diff = {
                left: null,
                right: null
            };

            /* Methods */

            $scope.compare = function () {
                // Clear results
                $scope.getHashes($scope.diff.left);
                $scope.getHashes($scope.diff.right);
            };

            $scope.getHashes = function (host) {

                $scope.app.running = NotificationsService.running(true);

                $http({
                    method: 'GET',
                    url: encodeURI(host.uri + $scope.app.servlet
                        + '?path=' + $scope.form.path
                        + '&_=' + new Date().getTime())
                }).
                    success(function (data, status, headers, config) {
                        host.data = data;

                        $scope.app.running = NotificationsService.running(false);
                    }).
                    error(function (data, status, headers, config) {
                        host.data = 'ERROR: Unable to collect JCR diff data from ' + host.name;

                        NotificationsService.add('error',
                            'ERROR', 'Unable to collect JCR diff data from ' + host.name);

                        $scope.app.running = NotificationsService.running(false);
                    });
            };

            $scope.init = function(hostNames) {
                angular.forEach(hostNames, function(hostName) {
                    this.push({
                        name: hostName,
                        uri: hostName,
                        data: '',
                        active: false
                    });
                }, $scope.hosts);
            };


    }]).directive('diff', function () {
        return {
            restrict: 'A',
            scope: {
                baseData: '=',
                newData: '=',
                inline: '@',
            },
            replace: false,
            link: function(scope, element, attrs) {

                var computeDiff = function() {
                    var sequenceMatcher, opCodes, diffData, baseAsLines, newAsLines;

                    if (scope.baseData && scope.baseData.data && scope.newData && scope.newData.data) {

                        baseAsLines = difflib.stringAsLines(scope.baseData.data);
                        newAsLines = difflib.stringAsLines(scope.newData.data);

                        sequenceMatcher = new difflib.SequenceMatcher(baseAsLines, newAsLines);
                        opCodes = sequenceMatcher.get_opcodes();

                        // build the diff view and add it to the current DOM
                        diffData = diffview.buildView({
                            baseTextLines: baseAsLines,
                            newTextLines: newAsLines,
                            opcodes: opCodes,
                            baseTextName: scope.baseData.name,
                            newTextName: scope.newData.name,
                            contextSize: 100,
                            viewType: scope.inline ? 1 : 0
                        });

                        element.html(diffData);

                    } else {
                        element.html('');
                    }
                };

                scope.$watch('baseData.data', function() {
                   computeDiff();
                });

                scope.$watch('newData.data', function() {
                    computeDiff();
                });
             }
        };
    });
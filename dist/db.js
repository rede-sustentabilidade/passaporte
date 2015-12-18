// this module handles with database connection
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _pg = require("pg");

var _pg2 = _interopRequireDefault(_pg);

var dbClient = (function () {
    var uri = process.env.DATABASE_URL,
        client = new _pg2["default"].Client(uri);

    client.connect();

    return client;
})();

exports["default"] = dbClient;
module.exports = exports["default"];
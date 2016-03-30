# json-api-serializer
[![Build Status](https://travis-ci.org/danivek/json-api-serializer.svg?branch=master)](https://travis-ci.org/danivek/json-api-serializer)
[![Coverage Status](https://coveralls.io/repos/github/danivek/json-api-serializer/badge.svg?branch=master)](https://coveralls.io/github/danivek/json-api-serializer?branch=master)


A Node.js framework agnostic library for serializing your data to [JSON API](http://jsonapi.org/) compliant responses (a specification for building APIs in JSON).

***Why another library for serializing data to JSON API ?***

Simply because others libraries are not as flexible as i need.


## Installation
```bash
npm install --save json-api-serializer
```

## Documentation

#### Register

```javascript
var JSONAPISerializer = require('json-api-serializer');
var Serializer = new JSONAPISerializer();
Serializer.register(type, options);
```
**Available options : **

- *id* (optional): The attributes to use as the reference. Default = 'id'.
- *blacklist* (optional): An array of blacklisted attributes. Default = [].
- *whitelist* (optional): An array of whitelisted attributes. Default = [].
- *links* (optional): An object that describes the links inside data. Values can be string or function (see examples below).
- *topLevelMeta* (optional): An object that describes the top-level meta. Values can be string or function (see examples below).
- *topLevelLinks* (optional): An object that describes the top-level links. Values can be string or function (see examples below).
- *relationships* (optional): An object defining some relationships
    - relationship: The property in data to use as a relationship
        - *type*: The type to use for serializing the relationship (type need to be register)
        - *links* (optional): An object that describes the links for the relationship. Values can be string or function (see examples below).

## Usage

input data (can be a simple object or an array of objects)
```javascript
// Data
var data = {
  id: "1",
  title: "JSON API paints my bikeshed!",
  body: "The shortest article. Ever.",
  created: "2015-05-22T14:56:29.000Z",
  updated: "2015-05-22T14:56:28.000Z",
  author: {
    id: "1",
    firstName: "Kaley",
    lastName: "Maggio",
    email: "Kaley-Maggio@example.com",
    age: "80",
    gender: "male"
  },
  tags: ["1", "2"],
  photos: ["ed70cf44-9a34-4878-84e6-0c0e4a450cfe", "24ba3666-a593-498c-9f5d-55a4ee08c72e", "f386492d-df61-4573-b4e3-54f6f5d08acf"],
  comments: [{
    _id: "1",
    body: "First !",
    created: "2015-08-14T18:42:16.475Z"
  }, {
    _id: "2",
    body: "I Like !",
    created: "2015-09-14T18:42:12.475Z"
  }, {
    _id: "3",
    body: "Awesome",
    created: "2015-09-15T18:42:12.475Z"
  }]
}
```

Register your resources types :
```javascript
var JSONAPISerializer = require('json-api-serializer');
var Serializer = new JSONAPISerializer();

// Register 'article' type
Serializer.register('article', {
  id: 'id', // The attributes to use as the reference. Default = 'id'.
  blacklist: ['updated'], // An array of blacklisted attributes. Default = []
  links: { // An object that describe links. Default = {}
    self: function(data) { // Can be a function or a string value ex: { self: '/articles/1'}
      return '/articles/' + data.id;
    }
  },
  relationships: { // An object defining some relationships.
    author: {
      type: 'people', // The type of the resource
      links: { // Relationships links
        self: function(data) {
          return '/articles/' + data.id + '/relationships/author';
        },
        related: function(data) {
          return '/articles/' + data.id + '/author';
        }
      },
    },
    tags: {
      type: 'tag' // The type of the resource
    },
    photos: {
      type: 'photo' // The type of the resource
    },
    comments: {
      type: 'comment' // The type of the resource
    }
  },
  topLevelMeta: { // An object that describe top level meta. Default = {}
    count: function(extraOptions) { // Can be a function (with extra options argument) or a string value
      return extraOptions.count;
    }
  },
  topLevelLinks: { // An object that describe top level links. Default = {}
    self: '/articles' // Can be a function (with extra options argument) or a string value
  }
});

// Register 'people' type
Serializer.register('people', {
  id: 'id',
  links: {
    self: function(data) {
      return '/peoples/' + data.id;
    }
  }
});

// Register 'tag' type
Serializer.register('tag', {
  id: 'id',
});

// Register 'photo' type
Serializer.register('photo', {
  id: 'id',
});

// Register 'comment' type
Serializer.register('comment', {
  id: '_id',
});
```

Serialize it with the corresponding resource type, data and optional extra options :

```javascript
Serializer.serialize('article', data, {count: 2});
```

The output data will be :
```JSON
{
  "jsonapi": {
    "version": "1.0"
  },
  "meta": {
    "count": 2
  },
  "links": {
    "self": "/articles"
  },
  "data": [{
    "type": "article",
    "id": "1",
    "attributes": {
      "title": "JSON API paints my bikeshed!",
      "body": "The shortest article. Ever.",
      "created": "2015-05-22T14:56:29.000Z"
    },
    "relationships": {
      "author": {
        "data": {
          "type": "people",
          "id": "1"
        },
        "links": {
          "self": "/articles/1/relationships/author",
          "related": "/articles/1/author"
        }
      },
      "tags": {
        "data": [{
          "type": "tag",
          "id": "1"
        }, {
          "type": "tag",
          "id": "2"
        }]
      },
      "photos": {
        "data": [{
          "type": "photo",
          "id": "ed70cf44-9a34-4878-84e6-0c0e4a450cfe"
        }, {
          "type": "photo",
          "id": "24ba3666-a593-498c-9f5d-55a4ee08c72e"
        }, {
          "type": "photo",
          "id": "f386492d-df61-4573-b4e3-54f6f5d08acf"
        }]
      },
      "comments": {
        "data": [{
          "type": "comment",
          "id": "1"
        }, {
          "type": "comment",
          "id": "2"
        }, {
          "type": "comment",
          "id": "3"
        }]
      }
    },
    "links": {
      "self": "/articles/1"
    }
  }],
  "included": [{
    "type": "people",
    "id": "1",
    "attributes": {
      "firstName": "Kaley",
      "lastName": "Maggio",
      "email": "Kaley-Maggio@example.com",
      "age": "80",
      "gender": "male"
    },
    "links": {
      "self": "/peoples/1"
    }
  }, {
    "type": "comment",
    "id": "1",
    "attributes": {
      "body": "First !",
      "created": "2015-08-14T18:42:16.475Z"
    }
  }, {
    "type": "comment",
    "id": "2",
    "attributes": {
      "body": "I Like !",
      "created": "2015-09-14T18:42:12.475Z"
    }
  }, {
    "type": "comment",
    "id": "3",
    "attributes": {
      "body": "Awesome",
      "created": "2015-09-15T18:42:12.475Z"
    }
  }]
}
```

Some others examples are available in [ tests folders](https://github.com/danivek/json-api-serializer/blob/master/test/)

## Requirements

json-api-serializer only use ECMAScript 2015 (ES6) features supported natively by Node.js 4 and above ([ECMAScript 2015 (ES6) | Node.js](https://nodejs.org/en/docs/es6/)). Make sure that you have Node.js 4+ or above.

## License

[MIT](https://github.com/danivek/json-api-serializer/blob/master/LICENSE)

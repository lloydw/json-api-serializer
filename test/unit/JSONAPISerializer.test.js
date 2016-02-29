'use strict';
 /* eslint-disable */

const expect = require('chai').expect;
const _ = require('lodash');

const JSONAPISerializer = require('../../');

describe('JSONAPISerializer', function() {
  describe('register', function() {
    it('should register an empty schema with the \'default\' schema name and default options', function(done) {
      const Serializer = new JSONAPISerializer();
      Serializer.register('articles');
      expect(Serializer.schemas).to.have.property('articles');
      expect(Serializer.schemas.articles).to.have.property('default');
      expect(Serializer.schemas.articles.default).to.eql(Serializer.validateOptions({}));
      done();
    });

    it('should register a schema with the \'default\' schema name', function(done) {
      const Serializer = new JSONAPISerializer();
      Serializer.register('articles', {
        id: 'id',
      });
      expect(Serializer.schemas).to.have.property('articles');
      expect(Serializer.schemas.articles).to.have.property('default');
      expect(Serializer.schemas.articles.default).to.eql(Serializer.validateOptions({
        id: 'id',
      }));
      expect(Serializer.schemas.articles.default).to.have.property('id').to.eql('id');
      done();
    });

    it('should register a schema with the \'custom\' schema name', function(done) {
      const Serializer = new JSONAPISerializer();
      Serializer.register('articles', 'custom');
      expect(Serializer.schemas).to.have.property('articles');
      expect(Serializer.schemas.articles).to.have.property('custom');
      done();
    });

    it('should throw an error for a bad options', function(done) {
      const Serializer = new JSONAPISerializer();
      expect(function() {
        Serializer.register('bad', {
          blackList: {
            bad: 'badOptions',
          },
        });
      }).to.throw(Error);
      done();
    });
  });

  describe('serializeData', function() {
    const Serializer = new JSONAPISerializer();
    Serializer.register('articles');
    const defaultOptions = Serializer.validateOptions({});

    it('should return null for an empty single data', function(done) {
      const serializedData = Serializer.serializeData('articles', {});
      expect(serializedData).to.eql(null);
      done();
    });

    it('should return null for an empty array data', function(done) {
      const serializedData = Serializer.serializeData('articles', []);
      expect(serializedData).to.eql([]);
      done();
    });

    it('should return serialized data for a single data', function(done) {
      const singleData = {
        id: '1',
        body: 'test body',
      };
      const serializedData = Serializer.serializeData('articles', singleData, defaultOptions);

      expect(serializedData).to.have.property('type').to.eql('articles');
      expect(serializedData).to.have.property('id').to.eql('1');
      expect(serializedData).to.have.property('attributes').to.have.property('body').to.eql('test body');
      expect(serializedData.relationships).to.be.undefined;
      expect(serializedData.links).to.be.undefined;

      done();
    });

    it('should return serialized data for an array data', function(done) {
      const arrayData = [{
        id: '1',
        body: 'test body 1',
      }, {
        id: '2',
        body: 'test body 2',
      }];
      const serializedData = Serializer.serializeData('articles', arrayData, defaultOptions);
      expect(serializedData).to.be.instanceof(Array).to.have.lengthOf(2);
      expect(serializedData[0]).to.have.property('type').to.eql('articles');
      expect(serializedData[0]).to.have.property('id').to.eql('1');
      expect(serializedData[0]).to.have.property('attributes').to.have.property('body').to.eql('test body 1');
      expect(serializedData[0].relationships).to.be.undefined;
      expect(serializedData[0].links).to.be.undefined;
      expect(serializedData[1]).to.have.property('type').to.eql('articles');
      expect(serializedData[1]).to.have.property('id').to.eql('2');
      expect(serializedData[1]).to.have.property('attributes').to.have.property('body').to.eql('test body 2');
      expect(serializedData[1].relationships).to.be.undefined;
      expect(serializedData[1].links).to.be.undefined;
      done();
    });

    it('should return serialized data with option id', function(done) {
      const singleData = {
        _id: '1',
      };
      const serializedData = Serializer.serializeData('articles', singleData, _.merge(defaultOptions, {
        id: '_id',
      }));
      expect(serializedData).to.have.property('type').to.eql('articles');
      expect(serializedData).to.have.property('id').to.eql('1');
      expect(serializedData.relationships).to.be.undefined;
      expect(serializedData.links).to.be.undefined;

      done();
    });
  });

  describe('serializeRelationship', function() {
    const Serializer = new JSONAPISerializer();
    Serializer.register('authors');
    Serializer.register('articles', {
      relationships: {
        author: {
          type: 'authors',
        },
      },
    });

    it('should return serialized relationship data and populated included for a to one populated relationship', function(done) {
      const included = [];
      const serializedRelationshipData = Serializer.serializeRelationship('authors', {
        id: '1',
        name: 'Author 1',
      }, Serializer.schemas.authors.default, included);
      expect(serializedRelationshipData).to.have.property('type').to.eql('authors');
      expect(serializedRelationshipData).to.have.property('id').to.eql('1');
      expect(included).to.have.lengthOf(1);
      done();
    });

    it('should return serialized relationship data and populated included for a to many populated relationships', function(done) {
      const included = [];
      const serializedRelationshipData = Serializer.serializeRelationship('authors', [{
        id: '1',
        name: 'Author 1',
      }, {
        id: '2',
        name: 'Author 2',
      }], Serializer.schemas.authors.default, included);
      expect(serializedRelationshipData).to.be.instanceof(Array).to.have.lengthOf(2);
      expect(serializedRelationshipData[0]).to.have.property('type').to.eql('authors');
      expect(serializedRelationshipData[0]).to.have.property('id').to.eql('1');
      expect(serializedRelationshipData[1]).to.have.property('type').to.eql('authors');
      expect(serializedRelationshipData[1]).to.have.property('id').to.eql('2');
      expect(included).to.have.lengthOf(2);
      done();
    });

    it('should return serialized relationship data and empty included for a to one unpopulated relationship', function(done) {
      const included = [];
      const serializedRelationshipData = Serializer.serializeRelationship('authors', '1', Serializer.schemas.authors.default, included);
      expect(serializedRelationshipData).to.have.property('type').to.eql('authors');
      expect(serializedRelationshipData).to.have.property('id').to.eql('1');
      expect(included).to.have.lengthOf(0);
      done();
    });

    it('should return serialized relationship data and empty included for a to many unpopulated relationship', function(done) {
      const included = [];
      const serializedRelationshipData = Serializer.serializeRelationship('authors', ['1', '2'], Serializer.schemas.authors.default, included);
      expect(serializedRelationshipData).to.be.instanceof(Array).to.have.lengthOf(2);
      expect(serializedRelationshipData[0]).to.have.property('type').to.eql('authors');
      expect(serializedRelationshipData[0]).to.have.property('id').to.eql('1');
      expect(serializedRelationshipData[1]).to.have.property('type').to.eql('authors');
      expect(serializedRelationshipData[1]).to.have.property('id').to.eql('2');
      expect(included).to.have.lengthOf(0);
      done();
    });
  });

  describe('serializeRelationships', function() {
    const Serializer = new JSONAPISerializer();
    Serializer.register('authors');
    Serializer.register('comments');
    Serializer.register('articles', {
      relationships: {
        author: {
          type: 'authors',
        },
        comments: {
          type: 'comments',
        },
      },
    });

    it('should return undefined relationships for no relationships options', function(done) {
      const included = [];
      const serializedRelationships = Serializer.serializeRelationships({
        id: '1',
        name: 'Author 1',
      }, Serializer.schemas.authors.default, included);
      expect(serializedRelationships).to.be.undefined;
      done();
    });

    it('should return relationships for author and comments', function(done) {
      const included = [];
      const serializedRelationships = Serializer.serializeRelationships({
        id: '1',
        author: {
          id: '1'
        },
        comments: [{
          id: '1'
        }, {
          id: '2'
        }],
      }, Serializer.schemas.articles.default, included);
      expect(serializedRelationships).to.have.property('author');
      expect(serializedRelationships.author).to.have.property('data');
      expect(serializedRelationships.author.data).to.have.property('type').to.eql('authors');
      expect(serializedRelationships.author.data).to.have.property('id').to.eql('1');
      expect(serializedRelationships.author).to.have.property('links').to.be.undefined;
      expect(serializedRelationships).to.have.property('comments');
      expect(serializedRelationships.comments).to.have.property('data').to.be.instanceof(Array).to.have.lengthOf(2);
      expect(serializedRelationships.comments.data[0]).to.have.property('type').to.eql('comments');
      expect(serializedRelationships.comments.data[0]).to.have.property('id').to.eql('1');
      expect(serializedRelationships.comments).to.have.property('links').to.be.undefined;
      done();
    });
  });

  describe('serializeAttributes', function() {
    const Serializer = new JSONAPISerializer();
    Serializer.register('articles');

    it('should return all attributes of data without id', function(done) {
      const data = {
        id: '1',
        title: 'My First article',
        body: 'Content of my article',
      };
      const serializedAttributes = Serializer.serializeAttributes(data, Serializer.schemas.articles.default);
      expect(serializedAttributes).to.not.have.property('id');
      expect(serializedAttributes).to.have.property('title');
      expect(serializedAttributes).to.have.property('body');
      done();
    });

    it('should return all attributes of data except for blacklisted attributes', function(done) {
      const data = {
        id: '1',
        title: 'My First article',
        body: 'Content of my article',
      };
      Serializer.register('articles', {
        blackList: ['body'],
      });
      const serializedAttributes = Serializer.serializeAttributes(data, Serializer.schemas.articles.default);
      expect(serializedAttributes).to.not.have.property('id');
      expect(serializedAttributes).to.have.property('title');
      expect(serializedAttributes).to.not.have.property('body');
      done();
    });
  });

  describe('serializeIncluded', function() {
    const Serializer = new JSONAPISerializer();
    it('should return undefined for empty included', function(done) {
      const serializedIncluded = Serializer.serializeIncluded([]);
      expect(serializedIncluded).to.be.undefined;
      done();
    });

    it('should return unique values', function(done) {
      const included = [{
        type: 'author',
        id: '1',
        name: 'Author 1',
      }, {
        type: 'author',
        id: '1',
        name: 'Author 1',
      }];
      const serializedIncluded = Serializer.serializeIncluded(included);
      expect(serializedIncluded).to.have.lengthOf(1);
      done();
    });
  });

  describe('getLinks', function() {

    const Serializer = new JSONAPISerializer();
    it('should get links with simple links options', function(done) {
      const linksOptions = {
        self: '/articles',
      };
      const links = Serializer.getLinks({}, linksOptions);
      expect(links).to.have.property('self').to.eql('/articles');
      done();
    });

    it('should get links with links (function) options', function(done) {
      const linksOptions = {
        self: function(data) {
          return '/articles/' + data.id;
        },
      };
      const links = Serializer.getLinks({
        id: '1',
      }, linksOptions);
      expect(links).to.have.property('self').to.eql('/articles/1');
      done();
    });
  });

  describe('serialize', function() {
    const Serializer = new JSONAPISerializer();
    Serializer.register('articles');

    it('should serialize empty single data', function(done) {
      const serializedData = Serializer.serialize('articles', {});
      expect(serializedData.data).to.eql(null);
      expect(serializedData.included).to.be.undefined;
      expect(serializedData.links).to.be.undefined;
      done();
    });

    it('should serialize empty array data', function(done) {
      const serializedData = Serializer.serialize('articles', []);
      expect(serializedData.data).to.eql([]);
      expect(serializedData.included).to.be.undefined;
      expect(serializedData.links).to.be.undefined;
      done();
    });

    it('should throw an error if type as not been registered', function(done) {
      expect(function() {
        Serializer.serialize('authors', {});
      }).to.throw(Error, 'No type registered for authors');
      done();
    });

    it('should throw an error if custom schema as not been registered', function(done) {
      expect(function() {
        Serializer.serialize('articles', {}, 'custom');
      }).to.throw(Error, 'No schema custom registered for articles');
      done();
    });
  });
});

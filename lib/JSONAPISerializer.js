'use strict';

const _ = require('lodash');
const joi = require('joi');

module.exports = class JSONAPISerializer {
  constructor(opts) {
    this.opts = opts || {};
    this.schemas = {};
  }

  validateOptions(options) {
    const optionsSchema = joi.object({
      id: joi.string().default('id'),
      blackList: joi.array().items(joi.string()).single().default([]),
      links: joi.object().default({}),
      relationships: joi.object().pattern(/.+/, joi.object({
        type: joi.string().required(),
        links: joi.object().default({}),
      })).default({}),
    }).required();

    const validated = joi.validate(options, optionsSchema);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.value;
  }

  register(type, schemaName, options) {
    if (_.isObject(schemaName)) {
      options = schemaName;
      schemaName = 'default';
    }

    const name = schemaName || 'default';
    const opts = this.validateOptions(_.defaults({}, options));

    _.set(this.schemas, [type, name].join('.'), opts);
  }

  serialize(type, data, schemaName) {
    const schema = schemaName || 'default';

    if (!this.schemas[type]) {
      throw new Error('No type registered for ' + type);
    }

    if (schema && !this.schemas[type][schema]) {
      throw new Error('No schema ' + schema + ' registered for ' + type);
    }

    const included = [];
    return _.assign({}, {
      jsonapi: {
        version: '1.0',
      },
      links: this.getLinks(this.opts, this.schemas[type][schema].topLevelLinks),
      data: this.serializeData(type, data, this.schemas[type][schema], included),
      included: this.serializeIncluded(included),
    });
  }

  serializeData(type, data, options, included) {
    // Empty data
    if (_.isEmpty(data)) {
      // Return [] or null
      return _.isArray(data) ? data : null;
    }

    // Array data
    if (_.isArray(data)) {
      return data.map(d => this.serializeData(type, d, options, included));
    }

    // Single data
    const resource = {
      type: type,
      id: data[options.id],
      attributes: this.serializeAttributes(data, options),
      relationships: this.serializeRelationships(data, options, included),
      links: this.getLinks(data, options.links),
    };

    return resource;
  }

  serializeIncluded(included) {
    const serializedIncluded = _.uniqWith(included, _.isEqual);
    return !_.isEmpty(serializedIncluded) ? serializedIncluded : undefined;
  }

  serializeAttributes(data, options) {
    return _.pick(data, _.difference(Object.keys(data), _.concat([options.id], Object.keys(options.relationships), options.blackList)));
  }

  serializeRelationships(data, options, included) {
    const serializedRelationships = {};

    _.forOwn(options.relationships, (rOptions, relationship) => {
      const serializeRelationship = {
        links: this.getLinks(data, rOptions.links),
        data: this.serializeRelationship(rOptions.type, data[relationship], this.schemas[options.relationships[relationship].type].default, included),
      };
      _.set(serializedRelationships, relationship, serializeRelationship);
    });

    return !_.isEmpty(serializedRelationships) ? serializedRelationships : undefined;
  }

  serializeRelationship(rType, rData, rOptions, included) {
    // Empty relationship data
    if (_.isEmpty(rData)) {
      // Return [] or null
      return _.isArray(rData) ? rData : null;
    }

    // To-many relationships
    if (_.isArray(rData)) {
      return rData.map(d => this.serializeRelationship(rType, d, rOptions, included));
    }

    // To-one relationship
    const serializedRelationship = {
      type: rType,
    };

    // support for unpopulated relationships (an id, or array of ids)
    if (!_.isPlainObject(rData)) {
      // Relationship has not been populated
      serializedRelationship.id = rData;
    } else {
      // Relationship has been populated
      serializedRelationship.id = rData[rOptions.id];
      included.push(this.serializeData(rType, rData, rOptions));
    }

    return serializedRelationship;
  }

  getLinks(data, linksOptions) {
    const links = _.mapValues(linksOptions, linkOpts => {
      let link;
      if (_.isFunction(linkOpts)) {
        link = linkOpts(data);
      } else {
        link = linkOpts;
      }
      return link;
    });

    return !_.isEmpty(links) ? links : undefined;
  }
};

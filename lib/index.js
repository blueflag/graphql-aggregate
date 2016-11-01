'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AverageType = AverageType;
exports.AggregationList = AggregationList;
exports.AggregationType = AggregationType;

var _immutable = require('immutable');

var _graphql = require('graphql');

var GeneralType = new _graphql.GraphQLScalarType({
    name: 'GeneralType',
    serialize: function serialize(value) {
        return value;
    },
    parseValue: function parseValue(value) {
        return value;
    },
    parseLiteral: function parseLiteral(ast) {
        return ast.value;
    }
});

var averageListTypes = {};
function AverageType(type) {
    if (!averageListTypes[type.name]) {
        averageListTypes[type.name] = new _graphql.GraphQLObjectType({
            name: type.name + 'Average',
            fields: function fields() {
                var types = (0, _immutable.fromJS)(type._typeConfig.fields()).reduce(function (resultFields, field, key) {
                    return resultFields.set(key, (0, _immutable.Map)({
                        type: GeneralType,
                        resolve: function resolve(obj) {
                            return obj.map(function (ii) {
                                return ii.reduce(function (rr, jj) {
                                    return rr + jj.get(key);
                                }, 0);
                            });
                        }
                    }));
                }, (0, _immutable.Map)());
                return types.toJS();
            }
        });
    }
    return averageListTypes[type.name];
}

var aggregationListsTypes = {};
function AggregationList(type) {
    if (!aggregationListsTypes[type.name]) {
        aggregationListsTypes[type.name] = new _graphql.GraphQLObjectType({
            name: type.name + 'AggregationList',
            fields: function fields() {
                return {
                    average: {
                        type: AverageType(type),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    distinct: {
                        type: new _graphql.GraphQLList(_graphql.GraphQLString),
                        resolve: function resolve(obj) {
                            return obj.keySeq().toJS();
                        }
                    },

                    // average:{
                    //         //Go through my list of lists and add stuff then devide by number
                    // },
                    // sum:{

                    // },
                    values: {
                        type: new _graphql.GraphQLList(new _graphql.GraphQLList(type)),
                        description: 'Values after aggregation ' + type.name,
                        resolve: function resolve(obj) {
                            return obj.valueSeq().toJS();
                        }
                    }
                };
            }
        });
    }
    return aggregationListsTypes[type.name];
}

function AggregationType(type) {
    return new _graphql.GraphQLObjectType({
        name: type.name + 'Aggregation',
        description: 'Preform aggregation methods on ' + type.name,
        fields: function fields() {
            return {
                values: {
                    description: 'List of ' + type.name,
                    type: new _graphql.GraphQLList(type),
                    resolve: function resolve(obj) {
                        return obj;
                    }
                },
                // average: {
                //     return
                // }
                groupedBy: {
                    type: new _graphql.GraphQLObjectType({
                        name: type.name + 'GroupedByAggregation',
                        description: 'Preform groupBy aggregation methods on ' + type.name,
                        fields: function fields() {
                            var types = (0, _immutable.fromJS)(type._typeConfig.fields()).reduce(function (resultFields, field, key) {
                                return resultFields.set(key, (0, _immutable.Map)({
                                    type: AggregationList(type),
                                    resolve: function resolve(obj) {
                                        return (0, _immutable.fromJS)(obj).groupBy(function (v) {
                                            return v.get(key);
                                        });
                                    }
                                }));
                            }, (0, _immutable.Map)());
                            return types.toJS();
                        }
                    }),
                    description: 'Preform groupBy aggregation methods on ' + type.name,
                    resolve: function resolve(obj) {
                        return obj;
                    }
                }
            };
        }
    });
}
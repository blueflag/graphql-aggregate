'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AverageType = AverageType;
exports.KeyedList = KeyedList;
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

// import imMath from 'immutable-math'

var imMath = require('immutable-math');

var INT_TYPE_NAME = 'Int';
var FLOAT_TYPE_NAME = 'Float';
var STRING_TYPE_NAME = 'String';

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

var keyedListTypes = {};
function KeyedList(type) {
    if (!keyedListTypes[type.name]) {
        keyedListTypes[type.name] = new _graphql.GraphQLObjectType({
            name: type.name + 'KeyedList',
            fields: function fields() {
                return {
                    keys: {
                        type: new _graphql.GraphQLList(_graphql.GraphQLString),
                        description: 'Keys after aggregation',
                        resolve: function resolve(obj) {
                            return obj.keySeq().toJS();
                        }
                    },
                    values: {
                        type: new _graphql.GraphQLList(AggregationType(type)),
                        description: 'Values after aggregation ' + type.name,
                        resolve: function resolve(obj) {
                            return obj.valueSeq().toJS();
                        }
                    }
                };
            }
        });
    }
    return keyedListTypes[type.name];
}

/**
 * This is going to get hectic, but we are going to have one of these for each field on the type... I think
 */
// var filterFuncTypes = {};
// export function FilterFunctions(type, field){
//     if(!filterFuncTypes[type.name]){
//         filterFuncTypes[type.name] = {};
//     }
//     if(!filterFuncTypes[type.name][field]){
//         filterFuncTypes[type.name][field] = new GraphQLObjectType({
//             name: `${field}${type.name}FilterFunctions`,
//             description: `Preform function to filter ${type.name} , ${field}`,
//             fields: () => ({
//                 gt : {
//                     description: `List of ${type.name}`,
//                     type: new GraphQLList(type),
//                     resolve: (obj) => obj
//                 },
//                 lt: {

//                 },
//                 equal : {

//                 }
//             })
//         })
//     }
//     return filterFuncTypes[type.name][field];
// }

// const filterFunctions = new GraphQLObjectType({
//     name: `FilterFunctions`,
//     description: `Preform function to filter`,
//     fields: () => ({
//         gt : {
//             description: `List of ${type.name}`,
//             type: new GraphQLList(type),
//             args:{

//             }
//             resolve: (obj) => obj.get('values').filter(v => v.get(obj.get(obj.filterType)))
//         },
//         lt: {

//         },
//         equal : {

//         }
//     })
// });

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a float
*/
function isFloat(field) {
    return field.get('type').name === FLOAT_TYPE_NAME;
}

/*
* @params field immutable map from GraphQLFieldConfig
*/
function isInt(field) {
    return field.get('type').name === INT_TYPE_NAME;
}

/*
* Checks if a Map from a graphql schema is a string
*/
function isString(field) {
    return field.get('type').name === STRING_TYPE_NAME;
}

var aggregationTypes = {};
function AggregationType(type) {
    if (!aggregationTypes[type.name]) {
        aggregationTypes[type.name] = new _graphql.GraphQLObjectType({
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

                    // groupedByNew : {
                    //     type: new GraphQLObjectType({
                    //         name: `${type.name}GroupedByNewAggregation`,
                    //         description: `Preform groupBy aggregation methods on ${type.name}`,
                    //         fields: () => {
                    //             let types = fromJS(type._typeConfig.fields())
                    //                 .reduce((resultFields, field, key) => {
                    //                     return resultFields.set(key, Map({
                    //                         type: new GraphQLList(AggregationType(type)),
                    //                         resolve: (obj) => fromJS(obj)
                    //                             .groupBy(v => v.get(key))
                    //                     }))
                    //                 }, Map())
                    //             return types.toJS();
                    //         },
                    //         resolve: (obj) => obj
                    //     })
                    // },

                    test: {
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'Test',
                            description: 'Preform groupBy aggregation methods on ' + type.name,
                            fields: function fields() {
                                return {
                                    test: {
                                        type: _graphql.GraphQLString
                                    }
                                    // let types = fromJS(type._typeConfig.fields())
                                    //     .reduce((resultFields, field, key) => {
                                    //         return resultFields.set(key, Map({
                                    //             type: KeyedList(type),
                                    //             resolve: (obj) => fromJS(obj)
                                    //                 .groupBy(v => v.get(key))
                                    //         }))
                                    //     }, Map())
                                    // return types.toJS();
                                };
                            }
                        }),
                        description: 'Preform groupBy aggregation methods on ' + type.name,
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },

                    groupedBy: {
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'GroupedByAggregation',
                            description: 'Preform groupBy aggregation methods on ' + type.name,
                            fields: function fields() {
                                var types = (0, _immutable.fromJS)(type._typeConfig.fields()).reduce(function (resultFields, field, key) {
                                    return resultFields.set(key, (0, _immutable.Map)({
                                        type: KeyedList(type),
                                        resolve: function resolve(obj) {
                                            return (0, _immutable.fromJS)(obj).groupBy(function (v) {
                                                return v.get(key);
                                            });
                                        }
                                    }));
                                }, (0, _immutable.Map)());

                                console.log('HELLO ', JSON.stringify(type._typeConfig.fields(), null, 4));
                                return types.toJS();
                            }
                        }),
                        description: 'Preform a groupBy aggregation method on ' + type.name,
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    sum: {
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'Sum',
                            description: 'Perform sum on ' + type.name,
                            fields: function fields() {
                                var types = (0, _immutable.fromJS)(type._typeConfig.fields()).reduce(function (resultFields, field, key) {
                                    if (isFloat(field) || isInt(field)) {
                                        console.log(field);
                                        return resultFields.set(key, (0, _immutable.Map)({
                                            type: _graphql.GraphQLFloat,
                                            resolve: function resolve(obj) {
                                                return (0, _immutable.fromJS)(obj).update(imMath.sumBy(function (ii) {
                                                    return field.get('resolve')(ii);
                                                }));
                                            }
                                        }));
                                    }
                                    return resultFields;
                                }, (0, _immutable.Map)());
                                console.log('Resulting types', types);
                                return types.toJS();
                            }
                        }),
                        description: 'Perform sum on ' + type.name,
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    }
                    // filter : {
                    //     name: `${type.name}FilterAggregation`,
                    //     description: `Preform filter aggregation methods on ${type.name}`,
                    //     args: {
                    //         gt: {
                    //             type: GeneralType,
                    //             description: `Check if value is `
                    //         }
                    //     }
                    //     fields: () => {
                    //         let types = fromJS(type._typeConfig.fields())
                    //             .reduce((resultFields, field, key) => {
                    //                 return resultFields.set(key, Map({
                    //                     type: KeyedList(type),
                    //                     resolve: (obj) => fromJS(obj)
                    //                         .groupBy(v => v.get(key))
                    //                 }))
                    //             }, Map())
                    //         return types.toJS();
                    //     }
                    // }
                };
            }
        });
    }
    return aggregationTypes[type.name];
}
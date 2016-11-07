'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.KeyedList = KeyedList;
exports.isFloat = isFloat;
exports.isInt = isInt;
exports.isString = isString;
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

var imMath = require('immutable-math');

var INT_TYPE_NAME = 'Int';
var FLOAT_TYPE_NAME = 'Float';
var STRING_TYPE_NAME = 'String';

/**
 * A list that has an associated group of keys,
 * @param {GraphQLOutputType} type that the keyed list is based on
 * @returns a GraphQLObjectType that is specific for the graphql object type being aggregated.
 */

// Because there is no way other then other then returning a
// GraphQLScalarType to have key value pairs, and then
// we have no way of adding more aggregations

var keyedListTypes = {};
function KeyedList(type) {
    if (!keyedListTypes[type.name]) {
        keyedListTypes[type.name] = new _graphql.GraphQLObjectType({
            name: type.name + 'KeyedList',
            fields: function fields() {
                return {
                    asMap: {
                        type: GeneralType,
                        description: 'Return an unstructed map',
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    keys: {
                        type: new _graphql.GraphQLList(_graphql.GraphQLString),
                        description: 'Keys after aggregation',
                        resolve: function resolve(obj) {
                            return (0, _immutable.fromJS)(obj).keySeq().toJS();
                        }
                    },
                    values: {
                        type: new _graphql.GraphQLList(AggregationType(type)),
                        description: 'Values after aggregation ' + type.name,
                        resolve: function resolve(obj) {
                            return (0, _immutable.fromJS)(obj).valueSeq().toJS();
                        }
                    }
                };
            }
        });
    }
    return keyedListTypes[type.name];
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a float
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Float (GraphQLFloat)
*/

function isFloat(field) {
    return field.get('type').name === FLOAT_TYPE_NAME;
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a int
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Int (GraphQLInt)
*/
function isInt(field) {
    return field.get('type').name === INT_TYPE_NAME;
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a string
* Checks if a Map from a graphql schema is a string
* @returns {boolean} true if the field is a String (GraphQLString)
*/

function isString(field) {
    return field.get('type').name === STRING_TYPE_NAME;
}

/**
 * Resolves fields using custom resolver or reverts to using obj.key
 */

var fieldResolver = function fieldResolver(field, key) {
    return function (obj) {
        return field.get('resolve', function (obj) {
            return obj[key];
        })(obj);
    };
};

//fieldResolver resolver for the type that we are creating the filds for.
function CreateFields(type, returnType, resolver, typeCheck) {

    var fields = type._typeConfig.fields();

    return (0, _immutable.fromJS)(fields).reduce(function (resultFields, field, key) {
        if (typeCheck(field)) {
            return resultFields.set(key, (0, _immutable.Map)({
                type: returnType,
                resolve: function resolve(obj) {
                    return resolver(fieldResolver(field, key), key, obj, field);
                }
            }));
        }
        return resultFields;
    }, (0, _immutable.Map)()).toJS();
}

var FilterIntOperations = new _graphql.GraphQLInputObjectType({
    name: "FilterIntOperations",
    description: 'Filter operations for int',
    fields: function fields() {
        return filterIntArgs;
    }
});

var filterIntArgs = {
    gt: {
        type: _graphql.GraphQLInt,
        description: 'Filter only values greater then value.'
    },
    lt: {
        type: _graphql.GraphQLInt,
        description: 'Filter only values less then value.'
    },
    gte: {
        type: _graphql.GraphQLInt,
        description: 'Filter only values greater then or equal to value'
    },
    lte: {
        type: _graphql.GraphQLInt,
        description: 'Filter only values less then or equal to value'
    },
    equal: {
        type: _graphql.GraphQLInt,
        description: 'Filter only values equal to value.'
    },
    not: {
        type: FilterIntOperations,
        description: 'Filter only values equal to value.'
    },
    or: {
        type: new _graphql.GraphQLList(FilterIntOperations),
        description: 'Filter only values equal to value.'
    }
};

var FilterStringOperations = new _graphql.GraphQLInputObjectType({
    name: "FilterStringOperations",
    description: 'Filter operations for strings',
    fields: function fields() {
        return filterStringArgs;
    }
});

var filterStringArgs = {
    gt: {
        type: _graphql.GraphQLString,
        description: 'Filter only values greater then value.'
    },
    lt: {
        type: _graphql.GraphQLString,
        description: 'Filter only values less then value.'
    },
    gte: {
        type: _graphql.GraphQLString,
        description: 'Filter only values greater then or equal to value'
    },
    lte: {
        type: _graphql.GraphQLString,
        description: 'Filter only values less then or equal to value'
    },
    equal: {
        type: _graphql.GraphQLString,
        description: 'Filter only values equal to value.'
    },
    not: {
        type: FilterStringOperations,
        description: 'Filter only values equal to value.'
    },
    or: {
        type: new _graphql.GraphQLList(FilterStringOperations),
        description: 'Filter only values equal to value.'
    }
};

var filterFunctions = function filterFunctions(field, key) {
    return {
        gt: function gt(_ref, value) {
            var _gt = _ref.gt;

            return _gt == null || _gt < value;
        },
        lt: function lt(_ref2, value) {
            var _lt = _ref2.lt;

            return _lt == null || _lt > value;
        },
        gte: function gte(_ref3, value) {
            var _gte = _ref3.gte;

            return _gte == null || _gte <= value;
        },
        lte: function lte(_ref4, value) {
            var _lte = _ref4.lte;

            return _lte == null || _lte >= value;
        },
        equal: function equal(_ref5, value) {
            var _equal = _ref5.equal;

            return _equal == null || _equal === value;
        },
        not: function not(_ref6, value, obj) {
            var _not = _ref6.not;

            return _not == null || !runFilterFunction(field, key)(_not, obj);
        }
    };
};

var runFilterFunction = function runFilterFunction(field, key) {
    return function (args, ii) {
        var _filterFunctions = filterFunctions(field, key),
            gt = _filterFunctions.gt,
            lt = _filterFunctions.lt,
            gte = _filterFunctions.gte,
            lte = _filterFunctions.lte,
            equal = _filterFunctions.equal,
            not = _filterFunctions.not;

        var resolver = fieldResolver(field, key);

        return gt(args, resolver(ii)) && lt(args, resolver(ii)) && gte(args, resolver(ii)) && lte(args, resolver(ii)) && equal(args, resolver(ii)) && not(args, resolver(ii), ii);
        //&& filterFunctions.or(args, field.get('resolve')(ii));
    };
};

var resolveIntFilter = function resolveIntFilter(field, key) {
    return function (obj, args) {
        return (0, _immutable.fromJS)(obj).filter(function (ii) {
            return runFilterFunction(field, key)(args, ii.toJS());
        }).toJS();
    };
};

function filterFieldConfigFactory(fields, field, key, type) {
    if (isInt(field)) {
        return fields.set(key, (0, _immutable.Map)({
            type: AggregationType(type),
            args: filterIntArgs,
            resolve: resolveIntFilter(field, key),
            description: 'Filters ' + key + ' via args.'
        }));
    }
    if (isString(field)) {
        return fields.set(key, (0, _immutable.Map)({
            type: AggregationType(type),
            args: filterStringArgs,
            resolve: resolveIntFilter(field, key),
            description: 'Filters ' + key + ' via args.'
        }));
    }
    return fields;
}

/**
 * Creates an AggregationType with it based on the GraphQLOutputType requested,
 * Objects that wish to be resolved this way must be a Array of the requested type.
 * 
 * @param {GraphQLOutputType} type - type to create the aggregaion functions for
 */

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
                    count: {
                        description: 'Size of the amount of items',
                        type: _graphql.GraphQLInt,
                        resolve: function resolve(obj) {
                            return obj.length;
                        }

                    },
                    first: {
                        description: 'Return the first item',
                        type: type,
                        resolve: function resolve(obj) {
                            return (0, _immutable.fromJS)(obj).first().toJS();
                        }
                    },
                    last: {
                        description: 'Return the last item',
                        type: type,
                        resolve: function resolve(obj) {
                            return (0, _immutable.fromJS)(obj).last().toJS();
                        }
                    },
                    reverse: {
                        description: 'Reverse the order of the list',
                        type: AggregationType(type),
                        resolve: function resolve(obj) {
                            return (0, _immutable.fromJS)(obj).reverse().toJS();
                        }
                    },
                    //slice: {}
                    // sort: {
                    //     description: 'Sort the list via the parameter',
                    //     fields: () =>
                    //         CreateFields(type, 
                    //             AggregationType(type),
                    //             (fieldResolver: * , key: string, obj: *) => {
                    //                 return fromJS(obj).sort((a, b) => {
                    //                     return fieldResolver(a) > fieldResolver(b)
                    //                 })
                    //             }, 
                    //             () => true)
                    // },
                    //flattern
                    //flattern should allow a CSV to be generated.
                    groupedBy: {
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'GroupedByAggregation',
                            description: 'Preform groupBy aggregation methods on ' + type.name,
                            fields: function fields() {

                                return CreateFields(type, KeyedList(type), function (fieldResolver, key, obj) {
                                    return (0, _immutable.fromJS)(obj).groupBy(function (ii) {
                                        return fieldResolver(ii.toJS());
                                    }).toJS();
                                }, function () {
                                    return true;
                                });
                            }
                        }),
                        description: 'Preform a groupBy aggregation method on ' + type.name,
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    filter: {
                        description: 'Preform filter aggregation methods on ' + type.name,
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'FilterAggregation',
                            description: 'Preform filter aggregation methods on ' + type.name,
                            args: filterIntArgs,
                            fields: function fields() {
                                return (0, _immutable.fromJS)(type._typeConfig.fields()).reduce(function (fields, typeField, key) {
                                    return filterFieldConfigFactory(fields, typeField, key, type);
                                }, (0, _immutable.Map)()).toJS();
                            }
                        }),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    sum: {
                        description: 'Perform sum on ' + type.name,
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'Sum',
                            description: 'Perform sum on ' + type.name,
                            fields: function fields() {
                                return CreateFields(type, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                    return (0, _immutable.fromJS)(obj).update(imMath.sumBy(function (ii) {
                                        return fieldResolver(ii.toJS());
                                    }));
                                }, function (field) {
                                    return isFloat(field) || isInt(field);
                                });
                            }
                        }),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    average: {
                        description: 'Returns the average of a field on ' + type.name,
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'Average',
                            description: 'Perform averages on ' + type.name,
                            fields: function fields() {
                                return CreateFields(type, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                    return (0, _immutable.fromJS)(obj).update(imMath.averageBy(function (ii) {
                                        return fieldResolver(ii.toJS());
                                    }));
                                }, function (field) {
                                    return isFloat(field) || isInt(field);
                                });
                            }
                        }),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    min: {
                        description: 'Returns the average of a field on ' + type.name,
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'Min',
                            description: 'Perform averages on ' + type.name,
                            fields: function fields() {
                                return CreateFields(type, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                    return (0, _immutable.fromJS)(obj).update(imMath.minBy(function (ii) {
                                        return fieldResolver(ii.toJS());
                                    }));
                                }, function (field) {
                                    return isFloat(field) || isInt(field);
                                });
                            }
                        }),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    max: {
                        description: 'Returns the average of a field on ' + type.name,
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'Max',
                            description: 'Perform averages on ' + type.name,
                            fields: function fields() {
                                return CreateFields(type, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                    return (0, _immutable.fromJS)(obj).update(imMath.maxBy(function (ii) {
                                        return fieldResolver(ii.toJS());
                                    }));
                                }, function (field) {
                                    return isFloat(field) || isInt(field);
                                });
                            }
                        }),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    }
                };
            }
        });
    }
    return aggregationTypes[type.name];
}
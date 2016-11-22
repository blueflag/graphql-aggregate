'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.KeyedListAggregation = KeyedListAggregation;
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

var keyedAggregationType = {};
function KeyedListAggregation(type) {
    if (!keyedAggregationType[type.name]) {
        keyedAggregationType[type.name] = new _graphql.GraphQLObjectType({
            name: type.name + 'AggregationKeyedList',
            fields: function fields() {
                return {
                    key: {
                        type: _graphql.GraphQLString,
                        description: 'Key after aggregation',
                        resolve: function resolve(obj) {
                            return obj.key;
                        }
                    },
                    aggregate: {
                        type: new AggregationType(type),
                        description: 'Further aggregaion ' + type.name,
                        resolve: function resolve(obj) {
                            return obj.value;
                        }
                    },
                    values: {
                        type: new _graphql.GraphQLList(type),
                        description: 'Values after aggregation ' + type.name,
                        resolve: function resolve(obj) {
                            return obj.value;
                        }
                    }
                };
            }
        });
    }
    return keyedAggregationType[type.name];
}

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
                            return (0, _immutable.Map)(obj).keySeq().toArray();
                        }
                    },
                    values: {
                        type: new _graphql.GraphQLList(AggregationType(type)),
                        description: 'Values after aggregation ' + type.name,
                        resolve: function resolve(obj) {
                            return (0, _immutable.Map)(obj).valueSeq().toArray();
                        }
                    },
                    keyValue: {
                        type: new _graphql.GraphQLList(KeyedListAggregation(type)),
                        description: 'Key-Values after aggregation ' + type.name,
                        resolve: function resolve(obj) {
                            return (0, _immutable.Map)(obj).reduce(function (rr, value, key) {
                                return rr.push({
                                    key: key,
                                    value: value
                                });
                            }, (0, _immutable.List)()).toArray();
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
 * Default resolver for when fields have no resolver attached.
 * 
 * by default graphql takes the key from the object that corresponds to the field being looked up.
 */
var defaultFieldResolver = function defaultFieldResolver(fieldName) {
    return function (obj) {
        return obj[fieldName];
    };
};

/**
 * Resolves fields using custom resolver associated with the field or reverts to using obj.key
 * 
 * @returns {function} partically applied function for creating resolver using args, context and the graphql resolve info.
 */

function fieldResolver(field, fieldName) {
    return function resolve(args, context, info) {
        /**
         * @params source - source object to use for resolving the field
         * @returns {Promise<any>} promise for resolving the field
         */
        return function (source) {
            return Promise.resolve(field.get('resolve', defaultFieldResolver(fieldName))(source, args, context, info));
        };
    };
}

// var fieldResolver = (field, fieldName) => (args, ctx, root) => (obj): Promise<*> => {
//     return Promise.resolve(() => field.get('resolve', defaultFieldResolver(fieldName))(obj, args, ctx, root))
// }


//fieldResolver resolver for the type that we are creating the filds for.
function createFields(type, returnType, resolver) {

    var fields = type._typeConfig.fields();

    return (0, _immutable.fromJS)(fields).reduce(function (resultFields, field, key) {
        return resultFields.set(key, (0, _immutable.Map)({
            type: returnType,
            resolve: function resolve(obj, args, ctx, info) {
                return resolver(fieldResolver(field, key)(args, ctx, info), key, obj, field);
            }
        }));
    }, (0, _immutable.Map)()).toJS();
}

function createFieldsFromFieldList(fields, returnType, resolver) {
    return (0, _immutable.fromJS)(fields).reduce(function (resultFields, field, key) {
        return resultFields.set(key, (0, _immutable.Map)({
            type: returnType,
            resolve: function resolve(obj, args, ctx, root) {
                return resolver(fieldResolver(field, key)(args, ctx, root), key, obj, field);
            }
        }));
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
    return function (args, value) {
        var _filterFunctions = filterFunctions(field, key),
            gt = _filterFunctions.gt,
            lt = _filterFunctions.lt,
            gte = _filterFunctions.gte,
            lte = _filterFunctions.lte,
            equal = _filterFunctions.equal,
            not = _filterFunctions.not;

        return gt(args, value) && lt(args, value) && gte(args, value) && lte(args, value) && equal(args, value);
    };
};

var resolveIntFilter = function resolveIntFilter(field, key) {
    return function (obj, args, ctx, root) {
        var resolver = fieldResolver(field, key)({}, ctx, root);
        var asList = (0, _immutable.List)(obj);
        return resolveFromArray(asList, resolver).then(function (resolvedValues) {
            return asList.filter(function (value, ii) {
                return runFilterFunction(field, key)(args, resolvedValues[ii]);
            });
        });
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

function containsType(fields, typeCheck) {
    return (0, _immutable.fromJS)(fields);
}
/**
 * Returns a list of resolved values from array using field resolver
 */
function resolveFromArray(arr, fieldResolver) {
    return Promise.resolve((0, _immutable.List)(arr)).then(function (list) {
        return Promise.all(list.map(function (obj) {
            return fieldResolver(obj);
        }).toArray());
    });
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
                var typeFields = (0, _immutable.fromJS)(type._typeConfig.fields());
                var intFields = typeFields.filter(function (field) {
                    return isFloat(field) || isInt(field);
                });
                var stringFields = typeFields.filter(function (field) {
                    return isString(field);
                });

                var fields = (0, _immutable.Map)({
                    values: {
                        description: 'List of ' + type.name,
                        type: new _graphql.GraphQLList(type),
                        resolve: function resolve(obj) {
                            return (0, _immutable.List)(obj).toArray();
                        }
                    },
                    count: {
                        description: 'The amount of items in the aggregaion',
                        type: _graphql.GraphQLInt,
                        resolve: function resolve(obj) {
                            return (0, _immutable.List)(obj).count();
                        }

                    },
                    first: {
                        description: 'Return the first item in the aggregaion',
                        type: type,
                        resolve: function resolve(obj) {
                            return (0, _immutable.List)(obj).first();
                        }
                    },
                    last: { // return fromJS()
                        description: 'Return the last item in the aggregaion',
                        type: type,
                        resolve: function resolve(obj) {
                            return (0, _immutable.List)(obj).last();
                        }
                    },
                    reverse: {
                        description: 'Reverse the order of the items in the aggregaion',
                        type: AggregationType(type),
                        resolve: function resolve(obj) {
                            return (0, _immutable.List)(obj).reverse();
                        }
                    },
                    //slice: {}
                    // sort: {
                    //     description: 'Sort the list via the parameter',
                    //     fields: () =>
                    //         createFields(type, 
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
                                return createFields(type, KeyedList(type), function (fieldResolver, key, obj) {
                                    // return Promise.resolve(List(obj))
                                    //     .then((obj) => {
                                    //         return Promise.all(obj.map((obj) => fieldResolver(obj)).toArray())
                                    //     })
                                    return resolveFromArray(obj, fieldResolver).then(function (result) {
                                        var groups = (0, _immutable.List)(result);
                                        return (0, _immutable.List)(obj).groupBy(function (item, ii) {
                                            return groups.get(ii);
                                        });
                                    });
                                });
                            }
                        }),
                        description: 'Group items in aggregaion by the value of a field.',
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    }

                });
                if (stringFields.count() > 0 || intFields.count() > 0) {
                    fields = fields.set('filter', {
                        description: 'Preform filter aggregation methods on ' + type.name,
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'FilterAggregation',
                            description: 'Preform filter aggregation methods on ' + type.name,
                            args: filterIntArgs,
                            fields: function fields() {
                                return stringFields.merge(intFields).reduce(function (fields, typeField, key) {
                                    return filterFieldConfigFactory(fields, typeField, key, type);
                                }, (0, _immutable.Map)()).toJS();
                            }
                        }),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    });
                    if (intFields.count() > 0) {
                        // add integer operations
                        fields = fields.merge((0, _immutable.Map)({
                            sum: {
                                description: 'Sum the values of a field on ' + type.name,
                                type: new _graphql.GraphQLObjectType({
                                    name: type.name + 'Sum',
                                    description: 'Perform sum on ' + type.name,
                                    fields: function fields() {
                                        return createFieldsFromFieldList(intFields, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                            return resolveFromArray(obj, fieldResolver).then(function (values) {
                                                return (0, _immutable.List)(values).update(imMath.sum());
                                            });
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
                                        return createFieldsFromFieldList(intFields, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                            return resolveFromArray(obj, fieldResolver).then(function (values) {
                                                return (0, _immutable.List)(values).update(imMath.average());
                                            });
                                        }, function (field) {
                                            return isFloat(field) || isInt(field);
                                        });
                                    }
                                }),
                                resolve: function resolve(obj) {
                                    return obj;
                                }
                            },
                            median: {
                                description: 'Returns the median value of a field on ' + type.name,
                                type: new _graphql.GraphQLObjectType({
                                    name: type.name + 'Median',
                                    description: 'Perform median calculation on ' + type.name,
                                    fields: function fields() {
                                        return createFieldsFromFieldList(intFields, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                            return resolveFromArray(obj, fieldResolver).then(function (values) {
                                                return (0, _immutable.List)(values).update(imMath.median());
                                            });
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
                                description: 'Returns the minium value of all the items on a field on ' + type.name,
                                type: new _graphql.GraphQLObjectType({
                                    name: type.name + 'Min',
                                    description: 'minium on value of a field for ' + type.name,
                                    fields: function fields() {
                                        return createFieldsFromFieldList(intFields, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                            return resolveFromArray(obj, fieldResolver).then(function (values) {
                                                return (0, _immutable.List)(values).update(imMath.min());
                                            });
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
                                description: 'Returns the maximum value of all the items on a field on' + type.name,
                                type: new _graphql.GraphQLObjectType({
                                    name: type.name + 'Max',
                                    description: 'maximum on value of a field for ' + type.name,
                                    fields: function fields() {
                                        return createFieldsFromFieldList(intFields, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                            return resolveFromArray(obj, fieldResolver).then(function (values) {
                                                return (0, _immutable.List)(values).update(imMath.max());
                                            });
                                        }, function (field) {
                                            return isFloat(field) || isInt(field);
                                        });
                                    }
                                }),
                                resolve: function resolve(obj) {
                                    return obj;
                                }
                            }
                        }));
                    }
                }
                return fields.toObject();
            }

        });
    }
    return aggregationTypes[type.name];
}
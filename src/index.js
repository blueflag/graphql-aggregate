// @flow

import {Map,fromJS} from 'immutable';
import {GraphQLList,
	GraphQLFloat,
	GraphQLScalarType,
	GraphQLObjectType,
	GraphQLString} from 'graphql'

const GeneralType =  new GraphQLScalarType({
    name: 'GeneralType',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (ast) => ast.value
});

// import imMath from 'immutable-math'

const imMath = require('immutable-math');

const INT_TYPE_NAME = 'Int';
const FLOAT_TYPE_NAME = 'Float';
const STRING_TYPE_NAME = 'String';

var averageListTypes = {}
export function AverageType(type){
    if(!averageListTypes[type.name]){
        averageListTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}Average`,
            fields: () => {
                let types = fromJS(type._typeConfig.fields())
                            .reduce((resultFields, field, key) => {
                                return resultFields.set(key, Map({
                                    type: GeneralType,
                                    resolve: (obj) => {
                                        return obj.map(ii => {
                                            return ii .reduce((rr, jj) => rr + jj.get(key), 0)
                                        })
                                    }
                                }))
                            }, Map())
                return types.toJS();
            }
        });
    }
    return averageListTypes[type.name]
}

var keyedListTypes = {};
export function KeyedList(type){
    if(!keyedListTypes[type.name]){
        keyedListTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}KeyedList`,
            fields: () => ({
                keys : {
                    type: new GraphQLList(GraphQLString),
                    description: `Keys after aggregation`,
                    resolve: (obj) => obj
                        .keySeq()
                        .toJS()
                },
                values: {
                    type: new GraphQLList(AggregationType(type)),
                    description:   `Values after aggregation ${type.name}`,
                    resolve: (obj) => {
                        return obj
                            .valueSeq()
                            .toJS()
                    }
                }
            })
        });
    }
    return keyedListTypes[type.name]
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
function isFloat(field: Map<string, *>): boolean {
    return field.get('type').name === FLOAT_TYPE_NAME
}

/*
* @params field immutable map from GraphQLFieldConfig
*/
function isInt(field: Map<string, *>): boolean {
    return field.get('type').name === INT_TYPE_NAME
}

/*
* Checks if a Map from a graphql schema is a string
*/
function isString(field: Map<string, *>): boolean {
    return field.get('type').name === STRING_TYPE_NAME
}


var aggregationTypes = {};
export function AggregationType(type: GraphQLOutputType): GraphQLOutputType {
    if(!aggregationTypes[type.name]){
        aggregationTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}Aggregation`,
            description: `Preform aggregation methods on ${type.name}`,
            fields: () => ({
                values : {
                    description: `List of ${type.name}`,
                    type: new GraphQLList(type),
                    resolve: (obj) => obj
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

                test : {
                    type: new GraphQLObjectType({
                        name: `${type.name}Test`,
                        description: `Preform groupBy aggregation methods on ${type.name}`,
                        fields: () => ({
                            test: {
                                type: GraphQLString
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
                        })
                    }),
                    description: `Preform groupBy aggregation methods on ${type.name}`,
                    resolve: (obj) => obj
                },

                groupedBy : {
                    type: new GraphQLObjectType({
                        name: `${type.name}GroupedByAggregation`,
                        description: `Preform groupBy aggregation methods on ${type.name}`,
                        fields: () => {
                            let types = fromJS(type._typeConfig.fields())
                                .reduce((resultFields, field, key) => {
                                    return resultFields.set(key, Map({
                                        type: KeyedList(type),
                                        resolve: (obj) => fromJS(obj)
                                            .groupBy(v => v.get(key))
                                    }))
                                }, Map())

                            console.log('HELLO ', JSON.stringify(type._typeConfig.fields(), null, 4))
                            return types.toJS();
                        }
                    }),
                    description: `Preform a groupBy aggregation method on ${type.name}`,
                    resolve: (obj) => obj
                },
                sum: {
                    type: new GraphQLObjectType({
                        name: `${type.name}Sum`,
                        description: `Perform sum on ${type.name}`,
                        fields: () => {
                            let types = fromJS(type._typeConfig.fields())
                                .reduce((resultFields, field, key) => {
                                    if(isFloat(field) || isInt(field)){
                                        console.log(field);
                                        return resultFields.set(key, Map({
                                            type: GraphQLFloat,
                                            resolve: (obj) => fromJS(obj).update(imMath.sumBy(ii => field.get('resolve')(ii)))
                                        }))
                                    }
                                    return resultFields;
                                }, Map())
                            console.log('Resulting types', types);
                            return types.toJS();
                        }
                    }),
                    description: `Perform sum on ${type.name}`,
                    resolve: (obj) => obj
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
            })
        })
    }
    return aggregationTypes[type.name];
}

// @flow

import {Map,fromJS} from 'immutable';
import {GraphQLList,
    GraphQLFloat,
    GraphQLScalarType,
    GraphQLObjectType,
    GraphQLString,
    GraphQLOutputType,
    GraphQLFieldConfig,
    GraphQLInt,
    GraphQLFieldConfigMap,
    GraphQLFieldConfigMapThunk} from 'graphql'

const GeneralType =  new GraphQLScalarType({
    name: 'GeneralType',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (ast) => ast.value
});

const imMath = require('immutable-math');

const INT_TYPE_NAME = 'Int';
const FLOAT_TYPE_NAME = 'Float';
const STRING_TYPE_NAME = 'String';

// var averageListTypes = {}
// export function AverageType(type){
//     if(!averageListTypes[type.name]){
//         averageListTypes[type.name] = new GraphQLObjectType({
//             name: `${type.name}Average`,
//             fields: () => {
//                 let types = fromJS(type._typeConfig.fields())
//                             .reduce((resultFields, field, key) => {
//                                 return resultFields.set(key, Map({
//                                     type: GeneralType,
//                                     resolve: (obj) => {
//                                         return obj.map(ii => {
//                                             return ii .reduce((rr, jj) => rr + jj.get(key), 0)
//                                         })
//                                     }
//                                 }))
//                             }, Map())
//                 return types.toJS();
//             }
//         });
//     }
//     return averageListTypes[type.name]
// }


/**
 * A list that has an associated group of keys,
 * @param {GraphQLOutputType} type that the keyed list is based on
 * @returns a GraphQLObjectType that is specific for the graphql object type being aggregated.
 */

// Because there is no way other then other then returning a
// GraphQLScalarType to have key value pairs, and then
// we have no way of adding more aggregations

var keyedListTypes = {};
export function KeyedList(type: GraphQLOutputType): GraphQLObjectType{
    if(!keyedListTypes[type.name]){
        keyedListTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}KeyedList`,
            fields: () => ({
                asMap : {
                    type: GeneralType,
                    description: `Return an unstructed map`,
                    resolve: (obj) => obj
                }, 
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
* @private
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Float (GraphQLFloat)
*/

function isFloat(field: Map<string, *>): boolean {
    return field.get('type').name === FLOAT_TYPE_NAME
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a int
* @private
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Int (GraphQLInt)
*/
function isInt(field: Map<string, *>): boolean {
    return field.get('type').name === INT_TYPE_NAME
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a string
* Checks if a Map from a graphql schema is a string
* @private
* @returns {boolean} true if the field is a String (GraphQLString)
*/

function isString(field: Map<string, *>): boolean {
    return field.get('type').name === STRING_TYPE_NAME
}

//fieldResolver resolver for the type that we are creating the filds for.
function CreateFields(type: GraphQLOutputType,
        returnType: GraphQLOutputType, 
        resolver: (fieldResolver: * , key: string, obj: *) => GraphQLFieldConfig,
        typeCheck: (field: GraphQLFieldConfig) => boolean
    ): GraphQLFieldConfigMap {

    let fields = type._typeConfig.fields()
    return fromJS(fields)
        .reduce((resultFields: Map<string,*>, field: Map<string,*>, key: string): Map<string, GraphQLFieldConfig> => {
            if(typeCheck(field)){
                return resultFields.set(key, Map({
                    type: returnType,
                    resolve: (obj): GraphQLFieldConfig => { return resolver(field.get('resolve'), key, obj) }
                }))
            }
            return resultFields;
        }, Map()).toJS();
}

// field, key

/**
 * Creates an AggregationType with a buvbased on the GraphQLOutputType requested,
 * Objects that wished to be resolved this way must be a Array of the requested type.
 *
 *   =
 * @param {GraphQLOutputType} type - type to create the aggregaion functions for
 */

var aggregationTypes = {};
export function AggregationType(type: GraphQLObjectType): GraphQLObjectType {
    if(!aggregationTypes[type.name]){
        aggregationTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}Aggregation`,
            description: `Preform aggregation methods on ${type.name}`,
            fields: (): GraphQLFieldConfigMap => ({
                values : {
                    description: `List of ${type.name}`,
                    type: new GraphQLList(type),
                    resolve: (obj: Array<*>): GraphQLList<*> => obj
                },
                count : {
                    description: `Size of the amount of items`,
                    type: GraphQLInt,
                    resolve: (obj: Array<*>): number => obj.length

                },
                groupedBy : {
                    type: new GraphQLObjectType({
                        name: `${type.name}GroupedByAggregation`,
                        description: `Preform groupBy aggregation methods on ${type.name}`,
                        fields: () => {
                            return CreateFields(type, 
                                KeyedList(type), 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).groupBy(ii => fieldResolver(ii))
                                }, 
                                () => true 
                            )
                        }
                    }),
                    description: `Preform a groupBy aggregation method on ${type.name}`,
                    resolve: (obj) => obj
                },
                sum: { 
                    description: `Perform sum on ${type.name}`,
                    type: new GraphQLObjectType({
                        name: `${type.name}Sum`,
                        description: `Perform sum on ${type.name}`,
                        fields: () => {
                            return CreateFields(type, 
                                GraphQLFloat, 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).update(imMath.sumBy(ii => fieldResolver(ii)))
                                }, 
                                (field) => isFloat(field) || isInt(field))
                        }
                    }),
                    resolve: (obj) => obj
                },
                average: {
                    description: `Returns the average of a field on ${type.name}`,
                    type: new GraphQLObjectType({
                        name: `${type.name}Average`,
                        description: `Perform averages on ${type.name}`,
                        fields: () => {
                            return CreateFields(type, 
                                GraphQLFloat, 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).update(imMath.averageBy(ii => fieldResolver(ii)))
                                }, 
                                (field) => isFloat(field) || isInt(field))
                        }
                    }),
                    resolve: (obj) => obj
                }
            })
        })
    }
    return aggregationTypes[type.name];
}

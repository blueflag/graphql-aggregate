const GeneralType = new GraphQLScalarType({
    name: 'GeneralType',
    serialize: value => value,
    parseValue: value => value,
    parseLiteral: ast => ast.value
});

var averageListTypes = {};
export function AverageType(type) {
    if (!averageListTypes[type.name]) {
        averageListTypes[type.name] = new GraphQLObjectType({
            name: `${ type.name }Average`,
            fields: () => {
                let types = fromJS(type._typeConfig.fields()).reduce((resultFields, field, key) => {
                    return resultFields.set(key, Map({
                        type: GeneralType,
                        resolve: obj => {
                            return obj.map(ii => {
                                return ii.reduce((rr, jj) => rr + jj.get(key), 0);
                            });
                        }
                    }));
                }, Map());
                return types.toJS();
            }
        });
    }
    return averageListTypes[type.name];
}

var aggregationListsTypes = {};
export function AggregationList(type) {
    if (!aggregationListsTypes[type.name]) {
        aggregationListsTypes[type.name] = new GraphQLObjectType({
            name: `${ type.name }AggregationList`,
            fields: () => ({
                average: {
                    type: AverageType(type),
                    resolve: obj => obj
                },
                distinct: {
                    type: new GraphQLList(GraphQLString),
                    resolve: obj => obj.keySeq().toJS()
                },

                // average:{
                //         //Go through my list of lists and add stuff then devide by number
                // },
                // sum:{

                // },
                values: {
                    type: new GraphQLList(new GraphQLList(type)),
                    description: `Values after aggregation ${ type.name }`,
                    resolve: obj => {
                        return obj.valueSeq().toJS();
                    }
                }
            })
        });
    }
    return aggregationListsTypes[type.name];
}

export function AggregationType(type) {
    return new GraphQLObjectType({
        name: `${ type.name }Aggregation`,
        description: `Preform aggregation methods on ${ type.name }`,
        fields: () => ({
            values: {
                description: `List of ${ type.name }`,
                type: new GraphQLList(type),
                resolve: obj => obj
            },
            // average: {
            //     return
            // }
            groupedBy: {
                type: new GraphQLObjectType({
                    name: `${ type.name }GroupedByAggregation`,
                    description: `Preform groupBy aggregation methods on ${ type.name }`,
                    fields: () => {
                        let types = fromJS(type._typeConfig.fields()).reduce((resultFields, field, key) => {
                            return resultFields.set(key, Map({
                                type: AggregationList(type),
                                resolve: obj => fromJS(obj).groupBy(v => v.get(key))
                            }));
                        }, Map());
                        return types.toJS();
                    }
                }),
                description: `Preform groupBy aggregation methods on ${ type.name }`,
                resolve: obj => obj
            }
        })
    });
}

import {isFloat, 
        isInt,
        isString, 
        AggregationType, 
        KeyedList} from '../index.js';
import {fromJS, Map} from 'immutable'
import {GraphQLFloat,
        GraphQLInt, 
        GraphQLString, 
        GraphQLObjectType} from 'graphql';

describe('TypeTests', () => {
    describe('isFloat', () => {
        it('Returns true if the type is a float', () => {
            expect(isFloat(fromJS({type: GraphQLFloat}))).toBeTruthy();
        });
    });
    describe('isInt', () => {
        it('Returns true if the type is an int', () => {
            expect(isInt(fromJS({type: GraphQLInt}))).toBeTruthy();
        });
    });
    describe('isString', () => {
        it('Returns true if the type is a string', () => {
            expect(isString(fromJS({type: GraphQLString}))).toBeTruthy();
        });
    });
});

describe('KeyedList', () => {
    describe('asMap', () => {
        it('Returns a map of the values', () => {

            var testType = new GraphQLObjectType({
                name: 'KeyListAsMapTest',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })
            var keyedList = KeyedList(testType);
            expect(keyedList._typeConfig.fields().asMap.resolve(fromJS({
                'test1': {
                    'id' : "test1"
                }, 
                'test2': {
                    'id' : "test1"
                }
            })))
            .toEqual({
                'test1': {
                    'id' : "test1"
                }, 
                'test2': {
                    'id' : "test1"
                } 
            })
        })
    });


    describe('keys', () => {
        it('Returns a list of the keys after aggregation', () => {

            var testType = new GraphQLObjectType({
                name: 'KeyListAsMapTest',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })
            var keyedList = KeyedList(testType);
            expect(keyedList._typeConfig.fields().keys.resolve(fromJS({
                'test1': {
                    'id' : "test1"
                }, 
                'test2': {
                    'id' : "test1"
                }
            })))
            .toEqual([
                'test1', 
                'test2'
            ])
        })
    });

    describe('values', () => {
        it('Returns the values in arrays', () => {
            var testType = new GraphQLObjectType({
                name: 'KeyListAsMapTest',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })

            var keyedList = KeyedList(testType);
            expect(keyedList._typeConfig.fields().values.resolve(Map({
                'test1': {
                    'id' : "test1",
                    'name' : "paul"
                }, 
                'test2': {
                    'id' : "test1",
                    'name' : "paul"
                }
            })))
            .toEqual([
                {
                    'id' : "test1",
                    'name' : "paul"
                }, 
                {
                    'id' : "test1",
                    'name' : "paul"
                }
            ])
        })
    })
});


describe('AggregationType', () => {
    describe('values', () => {
        it('Returns a list of values', () => {
            var testType = new GraphQLObjectType({
                name: 'TestType',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })
            var myAggregation = AggregationType(testType);
            expect(myAggregation._typeConfig.fields().values.resolve([{
                id: 'test',
                name: 'John',
            },{  
                id: 'test2',
                name: 'Richard',
            }])).toEqual([{
                id: 'test',
                name: 'John',
            },{  
                id: 'test2',
                name: 'Richard',
            }])
        });
    });

    describe('count', () => {
        it('Returns a amount of values in the supplied array', () => {
            var testType = new GraphQLObjectType({
                name: 'TestType',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })
            var myAggregation = AggregationType(testType);
            expect(myAggregation._typeConfig.fields().count.resolve([{
                id: 'test',
                name: 'John',
            },{  
                id: 'test2',
                name: 'Richard',
            }])).toEqual(2);
        });
    });

    describe('first', () => {
        it('Returns the first item in the array', () => {
            var testType = new GraphQLObjectType({
                name: 'TestType',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })
            var myAggregation = AggregationType(testType);
            expect(myAggregation._typeConfig.fields().first.resolve([{
                id: 'test',
                name: 'John',
            },{  
                id: 'test2',
                name: 'Richard',
            }])).toEqual({
                id: 'test',
                name: 'John',
            });
        });
    });

    describe('last', () => {
        it('Returns the last item in the array', () => {
            var testType = new GraphQLObjectType({
                name: 'TestType',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })
            var myAggregation = AggregationType(testType);
            expect(myAggregation._typeConfig.fields().last.resolve([{
                id: 'test',
                name: 'John',
            },{  
                id: 'test2',
                name: 'Richard',
            }])).toEqual({
                id: 'test2',
                name: 'Richard',
            });
        });
    });

    describe('reverse', () => {
        it('Returns the collection in reverse order.', () => {
            var testType = new GraphQLObjectType({
                name: 'TestType',
                fields: () => ({
                    id: {
                        type: GraphQLString
                    },
                    name: {
                        type: GraphQLString
                    }
                })
            })
            var myAggregation = AggregationType(testType);
            expect(myAggregation._typeConfig.fields().reverse.resolve([{
                id: 'test',
                name: 'John',
            },{  
                id: 'test2',
                name: 'Richard',
            }])).toEqual([{  
                id: 'test2',
                name: 'Richard',
            },{
                id: 'test',
                name: 'John',
            }]);
        })
    });

    describe('groupedBy', () => {
        it('Returns the collection mapped by a field', () => {
            var testType = new GraphQLObjectType({
                name: 'TestTypeGroupedBy',
                fields: () => ({
                    id: {
                        type: GraphQLString,
                        resolve: obj => obj.id
                    },
                    name: {
                        type: GraphQLString,
                        resolve: obj => obj.name
                    }
                })
            })

            var myAggregation = AggregationType(testType);
            var groupByObj = myAggregation._typeConfig.fields().groupedBy.resolve([{
                id: 'test',
                name: 'John',
            },{  
                id: 'test2',
                name: 'Richard',
            },{
                id: 'test3',
                name: 'Richard',  
            }])
            expect(
                myAggregation
                    ._typeConfig.fields().groupedBy.type
                    ._typeConfig.fields().name.resolve(groupByObj))
                .toEqual({
                    John: [
                        {
                            id: 'test',
                            name: 'John',
                        }
                    ],
                    Richard: [
                        {  
                            id: 'test2',
                            name: 'Richard',
                        },{
                            id: 'test3',
                            name: 'Richard',  
                        }
                    ]
                })
        })
    });

    describe('sum', () => {
        it('Returns the sum of a field', () => {
            var testType = new GraphQLObjectType({
                name: 'TestNumbers',
                fields: () => ({
                    id: {
                        type: GraphQLString,
                        resolve: obj => obj.id
                    },
                    number: {
                        type: GraphQLFloat,
                        resolve: obj => obj.number
                    }
                })
            })

            var myAggregation = AggregationType(testType);
            var sumObj = myAggregation._typeConfig.fields().sum.resolve([{
                id: 'test',
                number: 3,
            },{  
                id: 'test2',
                number: 3,
            },{
                id: 'test3',
                number: 4, 
            }])
            expect(
                myAggregation
                    ._typeConfig.fields().sum.type
                    ._typeConfig.fields().number.resolve(sumObj))
                .toEqual(10)
        })
    });

    describe('average', () => {
        it('Returns the average of a field', () => {
            var testType = new GraphQLObjectType({
                name: 'TestNumbers',
                fields: () => ({
                    id: {
                        type: GraphQLString,
                        resolve: obj => obj.id
                    },
                    number: {
                        type: GraphQLFloat,
                        resolve: obj => obj.number
                    }
                })
            })

            var myAggregation = AggregationType(testType);
            var averageObj = myAggregation._typeConfig.fields().average.resolve([{
                id: 'test',
                number: 1,
            },{  
                id: 'test2',
                number: 5,
            },{
                id: 'test3',
                number: 9, 
            }])
            expect(
                myAggregation
                    ._typeConfig.fields().average.type
                    ._typeConfig.fields().number.resolve(averageObj))
                .toEqual(5)
        })
    });

    describe('min', () => {
        it('Returns the smallest number in a field', () => {
            var testType = new GraphQLObjectType({
                name: 'TestNumbers',
                fields: () => ({
                    id: {
                        type: GraphQLString,
                        resolve: obj => obj.id
                    },
                    number: {
                        type: GraphQLFloat,
                        resolve: obj => obj.number
                    }
                })
            })

            var myAggregation = AggregationType(testType);
            var minObj = myAggregation._typeConfig.fields().min.resolve([{
                id: 'test',
                number: 1,
            },{  
                id: 'test2',
                number: 5,
            },{
                id: 'test3',
                number: 9, 
            }])
            expect(
                myAggregation
                    ._typeConfig.fields().min.type
                    ._typeConfig.fields().number.resolve(minObj))
                .toEqual(1)
        })
    });

    describe('max', () => {
        it('Returns the largest number in a field', () => {
            var testType = new GraphQLObjectType({
                name: 'TestNumbers',
                fields: () => ({
                    id: {
                        type: GraphQLString,
                        resolve: obj => obj.id
                    },
                    number: {
                        type: GraphQLFloat,
                        resolve: obj => obj.number
                    }
                })
            })

            var myAggregation = AggregationType(testType);
            var maxObj = myAggregation._typeConfig.fields().max.resolve([{
                id: 'test',
                number: 1,
            },{  
                id: 'test2',
                number: 5,
            },{
                id: 'test3',
                number: 9, 
            }])
            expect(
                myAggregation
                    ._typeConfig.fields().max.type
                    ._typeConfig.fields().number.resolve(maxObj))
                .toEqual(9)
        })
    });


    describe('filter', () => {

        describe('gt', () => {
            it('Filters by values greater then. ', () => {
                var testType = new GraphQLObjectType({
                    name: 'TestNumberInt',
                    fields: () => ({
                        id: {
                            type: GraphQLString,
                            resolve: obj => obj.id
                        },
                        number: {
                            type: GraphQLInt,
                            resolve: obj => obj.number
                        }
                    })
                })

                var myAggregation = AggregationType(testType);
                var maxObj = myAggregation._typeConfig.fields().filter.resolve([{
                    id: 'test',
                    number: 1,
                },{  
                    id: 'test2',
                    number: 5,
                },{
                    id: 'test3',
                    number: 9, 
                }])
                expect(
                    myAggregation
                        ._typeConfig.fields().filter.type
                        ._typeConfig.fields().number.resolve(maxObj, {gt: 5}))
                    .toEqual([{
                        id: 'test3',
                        number: 9
                    }])
            })
        });
        describe('lt', () => {
            it('Filters by values less then. ', () => {
                var testType = new GraphQLObjectType({
                    name: 'TestNumberInt',
                    fields: () => ({
                        id: {
                            type: GraphQLString,
                            resolve: obj => obj.id
                        },
                        number: {
                            type: GraphQLInt,
                            resolve: obj => obj.number
                        }
                    })
                })

                var myAggregation = AggregationType(testType);
                var maxObj = myAggregation._typeConfig.fields().filter.resolve([{
                    id: 'test',
                    number: 1,
                },{  
                    id: 'test2',
                    number: 5,
                },{
                    id: 'test3',
                    number: 9, 
                }])
                expect(
                    myAggregation
                        ._typeConfig.fields().filter.type
                        ._typeConfig.fields().number.resolve(maxObj, {lt: 5}))
                    .toEqual([{
                        id: 'test',
                        number: 1
                    }])
            })
        });
        describe('gte', () => {
            it('Filters by values greater then or equal to. ', () => {
                var testType = new GraphQLObjectType({
                    name: 'TestNumberInt',
                    fields: () => ({
                        id: {
                            type: GraphQLString,
                            resolve: obj => obj.id
                        },
                        number: {
                            type: GraphQLInt,
                            resolve: obj => obj.number
                        }
                    })
                })

                var myAggregation = AggregationType(testType);
                var maxObj = myAggregation._typeConfig.fields().filter.resolve([{
                    id: 'test',
                    number: 1,
                },{  
                    id: 'test2',
                    number: 5,
                },{
                    id: 'test3',
                    number: 9, 
                }])
                expect(
                    myAggregation
                        ._typeConfig.fields().filter.type
                        ._typeConfig.fields().number.resolve(maxObj, {gte: 5}))
                .toEqual([{  
                        id: 'test2',
                        number: 5,
                    },{
                        id: 'test3',
                        number: 9
                    }])

               
             })
        });
        describe('lte', () => {
            it('Filters by values less then or equal to. ', () => {
                var testType = new GraphQLObjectType({
                    name: 'TestNumberInt',
                    fields: () => ({
                        id: {
                            type: GraphQLString,
                            resolve: obj => obj.id
                        },
                        number: {
                            type: GraphQLInt,
                            resolve: obj => obj.number
                        }
                    })
                })

                var myAggregation = AggregationType(testType);
                var maxObj = myAggregation._typeConfig.fields().filter.resolve([{
                    id: 'test',
                    number: 1,
                },{  
                    id: 'test2',
                    number: 5,
                },{
                    id: 'test3',
                    number: 9, 
                }])
                expect(
                    myAggregation
                        ._typeConfig.fields().filter.type
                        ._typeConfig.fields().number.resolve(maxObj, {lte: 5}))
                .toEqual([{  
                        id: 'test',
                        number: 1,
                    },{
                        id: 'test2',
                        number: 5
                    }])

             })
        });
        describe('equal', () => {
            it('Filters by values equal to ', () => {
                var testType = new GraphQLObjectType({
                    name: 'TestNumberInt',
                    fields: () => ({
                        id: {
                            type: GraphQLString,
                            resolve: obj => obj.id
                        },
                        number: {
                            type: GraphQLInt,
                            resolve: obj => obj.number
                        }
                    })
                })

                var myAggregation = AggregationType(testType);
                var maxObj = myAggregation._typeConfig.fields().filter.resolve([{
                    id: 'test',
                    number: 1,
                },{  
                    id: 'test2',
                    number: 5,
                },{
                    id: 'test3',
                    number: 9, 
                }])
                expect(
                    myAggregation
                        ._typeConfig.fields().filter.type
                        ._typeConfig.fields().number.resolve(maxObj, {equal: 5}))
                .toEqual([{
                        id: 'test2',
                        number: 5
                    }])
                })     
        })     
        describe('not', () => {
            it('Returns values that don\'t match the filter ', () => {
                var testType = new GraphQLObjectType({
                    name: 'TestNumberInt',
                    fields: () => ({
                        id: {
                            type: GraphQLString,
                            resolve: obj => obj.id
                        },
                        number: {
                            type: GraphQLInt,
                            resolve: obj => obj.number
                        }
                    })
                })

                var myAggregation = AggregationType(testType);
                var maxObj = myAggregation._typeConfig.fields().filter.resolve([{
                    id: 'test',
                    number: 1,
                },{  
                    id: 'test2',
                    number: 5,
                },{
                    id: 'test3',
                    number: 9, 
                }])
                expect(
                    myAggregation
                        ._typeConfig.fields().filter.type
                        ._typeConfig.fields().number.resolve(maxObj, {not: {equal: 5}}))
                .toEqual([{
                    id: 'test',
                    number: 1,
                },{
                    id: 'test3',
                    number: 9, 
                }])
            })
        })   

        // describe('FilterStringOperations', () => {
        //     it('Contains arguments for filtering via strings.', () => {
        //         var testType = new GraphQLObjectType({
        //             name: 'TestNumberInt',
        //             fields: () => ({
        //                 id: {
        //                     type: GraphQLString,
        //                     resolve: obj => obj.id
        //                 },
        //                 number: {
        //                     type: GraphQLInt,
        //                     resolve: obj => obj.number
        //                 }
        //             })
        //         })
        //         var myAggregation = AggregationType(testType);

        //          console.log(myAggregation
        //                 ._typeConfig.fields().filter.type
        //                 ._typeConfig.fields().id.args);

        //     });
        // });
    });
});
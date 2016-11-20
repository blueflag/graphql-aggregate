# graphql-aggregate

[![CircleCI](https://circleci.com/gh/blueflag/graphql-aggregate.svg?style=shield)](https://circleci.com/gh/blueflag/graphql-aggregate)
[![Coverage Status](https://coveralls.io/repos/github/blueflag/graphql-aggregate/badge.svg?branch=master)](https://coveralls.io/github/blueflag/graphql-aggregate?branch=master)


Generates an aggregation schema for graphql that can be used to perform aggregation functions 
via a graphql query on Arrays of GraphQL types. 

## Usage

To get access to an aggregation schema on a graphql you require an array of objects

###Sample Code

A small sample, using express-graphql and some sample data exists [here](https://github.com/thepont/graphql-aggregate-sample)

###Example

The following `GraphQLFieldConfig` defines a list of answers

```javascript
answers : {
  type: new GraphQLList(AnswerType)
}
```

It can be turned into an aggregate type using the following `GraphQLFieldConfig`

_see GraphQL's documentation on field configuration of the [GraphQLObjectType](http://graphql.org/graphql-js/type/#graphqlobjecttype)_

```javascript
import {AggregationType} from 'graphql-aggregate'

// Creates an AggregationType with based on the AnswerType
// The resolver must return an Array that can be resolved into AnswerTypes

aggregateAnswers: {
    type: AggregationType(AnswerType), 
    resolve: (obj) => obj.answers
}
``` 

after this is done, the schema will allow the user to aggregate tusing the fields 
in the answer type.

for instance if the AnswerType had the following definition.

```
type AnswerType {
  id: ID,
  username: String,
  usersAnswer: Int!
}
```

The following query would be a valid way of finding the amount of answers attributed to each user.

```graphql
aggregateAnswers {
    groupedBy {
      username {
        keys
        values {
            count
          }
        }
      }
    }
  }
}

```

You can also further apply aggregations on the aggregation.

```graphql
aggregateAnswers {
    groupedBy {
      username {
        keys
        values {
            groupedBy {
              usersAnswer {
                asMap
              }
            }
          }
        }
      }
    }
  }
}

```

### Supplied Schema

Aggregation types will be named based on the type the were created from, for instance if our type was named `Answer` our aggregation type would be named `AnswerAggregation`.

####Fields Provided

The follow is the fields that are provided via the api, the best way of seeing exactly how it works is by using GraphiQL to investigate the fields.

The Aggregation provides fields dependent on the type that it is created with, this allows a more natural syntax then using arguments to lookup preknown values, and allows us to use graphql type checking simply on the queries.

```
Aggregation<T> : {
  values: [T],                        // Values in aggregation.
  count: Int,                         // Amount of values in aggregation.
  groupedBy: GroupedByAggregation<T> : { 
    fields in T...: KeyedList: {
      asMap: Scaler                   //Map of key/values.
      keys: List<String>              //List of keys in order.
      values: Aggregation<T>          //Returns the aggregation functions to be used on the values of the current aggregation
    },
  },
  filter: FilterAggregation<T> : {    //Filter aggregation methods
    int fields in T...args:(gt: int, lt: int, gte: int, equal int): Aggregation<T>
    string fields in T...args:(gt: string, lt: string, gte: string, equal string): Aggregation<T>
  },
  sum: {
    float or int fields in T...: int // sum of the all the values in the field.
  },
  average: {
    float or int fields in T...: int // average of the all the values in the field.
  },
  min: {
    float or int fields in T...: int // minimum value in the field.
  },
  max: {
    float or int fields in T...: int // maximum value in the field.
  }
}

``` 

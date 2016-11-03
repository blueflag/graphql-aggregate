# graphql-aggregate

Generates an aggregation schema for graphql that can be used to perform aggregation functions 
via a graphql query on Arrays of GraphQL types. 

## Usage

To get access to an aggregation schema on a graphql you require an array of objects

###Example

The following [`GraphQLFieldConfig`][1]  defines a list of answers

```javascript
answers : {
  type: new GraphQLList(AnswerType)
}
```

It can be turned into an aggregate type using the following [`GraphQLFieldConfig`][1] 

```javascript

// Creates an AggregationType with based on the AnswerType
// The resolver must return an Array that can be resolved into AnswerTypes

aggregateAnswers: {
    type: AggregationType(AnswerType), 
    resolve: (obj) => obj.answers
}
``` 

after this is done, the schema will allow the user to aggregate using the fields 
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


[1]: see GraphQL's documentation on field configuration of the [GraphQLObjectType](http://graphql.org/graphql-js/type/#graphqlobjecttype)
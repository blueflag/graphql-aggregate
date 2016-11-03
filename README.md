# graphql-aggregate

Generates an aggregation schema for graphql that can be used to perform aggregation functions 
via a graphql query on Arrays of GraphQL types. 

## Usage

To get access to an aggregation schema on a graphql you require an array of objects

###Example

The following list of answers

```
answers : {
  type: new GraphQLList(AnswerType)
}
```

can be turned into an aggregate type using the following functions.

```
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
  value: Int!
}
```

The following query would be a valid way of finding the amount of answers attributed to each user.

```
aggregateAnswers {
    groupedBy{
      username {
        keys
        values{
            count
          }
        }
      }
    }
  }
}

```
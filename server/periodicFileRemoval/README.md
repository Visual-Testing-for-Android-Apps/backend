# Periodic File Removal

This Lambda function checks all jobs in the database and removes any that are older than 30 days. The accompanying files in the S3 bucket will also be removed, as stated in our privacy policy.

## Running the function

Iterating over the entire database is quite costly so this function should not run continually. It is possible for it to be automatically triggered by AWS, say once per day, but this has not yet been added to our deployment file.

You can either add this though the AWS Console, or the function can be manually invocated.

### Manual invocation

1. Navigate to the Lambda function in your AWS Console.
2. Select the dropdown next to the "Test" button, in the top-right.
3. If this is your first time invoking this function then select the option "Configure test events", which will open a dialogue. Else skip to step 8.
4. Select the "Create new test event" bubble and leave the template selection as is.
5. Replace the example message with `{}` as this Lambda function expects an event
6. Enter a name into "Event name", such as "EmptyEvent".
7. Press the "Create" button, which will close the dialogue.
8. Ensure that the dropdown option now refers to the event you created.
9. Hit test.

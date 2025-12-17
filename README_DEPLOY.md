Deployment notes — Dream Decol Backend

1) MongoDB Atlas network access
- Add the Render outbound IPs or your specific IP to the Atlas IP access list.
- To allow the provided IP temporarily, add: 129.222.149.116
- For quick testing (less secure), you can add 0.0.0.0/0 to allow all IPs.

2) Render environment variable
- In your Render service dashboard, go to "Environment" → "Environment Variables" and set:
  - Key: `MONGODB_URI`
  - Value: (use your full connection string below)

3) Recommended full connection string (use this in Render `MONGODB_URI`):

mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/dream_decol?retryWrites=true&w=majority&appName=Cluster0

4) Mongo CLI examples
- mongodump (export `dream_decol`):

mongodump --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/dream_decol"

- mongorestore (restore into cluster):

mongorestore --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net"

- mongoimport (import JSON into a collection):

mongoimport --uri "mongodb+srv://nsanzimanaesdras2_db_user:VDjcotwlaT0l65Bc@cluster0.1jag5yi.mongodb.net/<database>" --collection <collection> --type json --file <path/to/file.json>

5) Notes
- Do NOT commit credentials to the repository. Use Render environment variables instead.
- After adding the IP to Atlas and setting `MONGODB_URI` in Render, redeploy the service.
- If connection still fails, allow 5–10 minutes for Atlas network changes to propagate, then redeploy.

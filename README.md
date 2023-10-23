# SnapShare
> Social Media Platform
## Info
- Author:          Paul Airuehia
- Date:            December 8, 2022
- Short Demo:      [Video]

## Purpose         
This application primarily uses [express] for the back-end and [node.js] to run the server. It also makes use of [MongoDB] for persistent data storage. 
The front-end uses [HTML5], [CSS3], and [JavaScript]. 
The UI design is done mainly with [Bootstrap5].

This application is an artwork social media platform that can be used to post and interact with pictures and can be used 
to host courses for other users. This application features two types of users, the users who can view and interact with 
posts and those with additional posting capabilities called "artists". Interactions with posts are done by either 
liking or leaving a review on a post. In addition, users can follow and unfollow any user who is an artist, and they
may also join any of their courses.

## Application Execution

### Requirements
This application requires these programs to run: 
  - [MongoDB]
  - [node.js]

### Installation

Start your MongoDB Database
```
Create a config.json and include an object with a single key called "mongo_uri"
which contains your specific MongoDB URI
```

Install the NPM dependencies and initialize the database to start the server.
```sh
npm install
node ./database-initializer.js
node ./server.js
```

## More Info
> This back-end for this application implements RESTful techniques where possible. Such as the correct use of HTTP status
> codes and proper routing throughout the server. The server and client do not depend on each other. On the server,
> modules such as Morgan help clarify the requests sent throughout the server. When possible, most operations are 
> asynchronous, so the server can handle multiple users making changes simultaneously. The webpage uses Bootstrap's
> dark theme and some added CSS to give the webpage a more modern dark-themed look, with inspiration from Google's 
> Material Dark design for better user interaction.

## Features
- Artists can delete posts or courses
- Notifications bar at the top of the page and Notifications can be deleted
- Error alerts on several pages
- Input validation on the client and server-side
- All input can be entered using the "enter" button on the keyboard
- Main pages have alternating colour themes (Blue and Green Buttons)


[//]: # (links)

   [node.js]: <http://nodejs.org>
   [express]: <http://expressjs.com>
   [HTML5]: <https://developer.mozilla.org/en-US/docs/Glossary/HTML5>
   [CSS3]: <https://developer.mozilla.org/en-US/docs/Web/CSS>
   [MongoDB]: <https://www.mongodb.com/>
   [JavaScript]: <https://developer.mozilla.org/en-US/docs/Web/JavaScript>
   [Bootstrap5]: <https://getbootstrap.com/>
   [Video]: <https://www.youtube.com/watch?v=7a3CIyNK8XA>

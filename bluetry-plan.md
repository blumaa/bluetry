### bluetry

## a website where I post my poems

## Stories

## viewers
# viewers can go to my website and see a list of poems on the left (drawer for mobile)
# viewers can click on a poem and see the poem and read it in the correct format
# viewers can like a poem
# viewers can share a poem with a link
# viewers can comment on a poem
# viewers can reply to a comment
# viewers can sign up to be on the mailing list

## users
# users can login
# users can post a poem
# users can send a poem/email to the email list (same editing component as posting a poem but checkbox for email)
# users can format the poem
# users can save a poem as a draft
# users can edit a poem
# users can delete a poem (with confirmation buttons)
# users can reorder poems
# users can pin five favourite poems
# users can delete comments on poems
# users can logout

## Framework

## frontend
# next.js
# typescript
# tailwind
# eslint 
# framer-motion?
# react-testing-library
# jest
# analytics
# use the mond design system
# has light/dark mode

## frontend architecture
# main page should just be a scrollable list of latest poems
# PoemCard
# PoemCard should have a header and the poem underneath and line underneath that with likes and comments in a thread (like reddit)
# Create/Edit Form/Page
# Create Comment Page (comments are not editable)
# PoemList (drawer on mobile) -- should list all poems, most recent first, but pinned poems before the most recent in a section called pinned poems
# login/logout upper right
# when logged in, menu at top to create poem or drafts list or check activity (comments + likes)-- this should be a list of poems with their activity
# pinned poems - edit the pinned poems - when in admin/logged in mode a poem should have a pin or unpin button next to likes/comments

## backend
# firebase?

### Bluetry Updates (or Bluminous Poetry)

## UI updates to architecture
# the main page should display a left panel with a list of the titles of poems. pinned poems should be first followed by most recent ones.
# the panel should be hidden automatically in mobile view and opened by a drawer icon in the upper left of the website (and closed by this icon reversed in the upper right of the panel). you can use this icon in desktop view as well to slide the panel closed, but the panel should be open by default in desktop view.
# a poem should not have a read more and should not be truncated. show the whole poem.
# build an individual poem page. this page will be what the user sees when clicking on the poem. you can reuse the poem card for this. but add a back to list button below the card.
# I see the login button goes nowhere. build a login page.
# for now you can mock the login with username: test and password test. that should take me to the admin section where I can add a new poem.

### more changes
  - make pagination section sticky
  - use the title of the poem as the individual poem's url
  - the share link button should just copy a link to the url of that poem to the systsem clipboard.
  - the whole border of the poem card should be clickable from the main page but not the contents of it
  - the new poem/create button goes to a page with errors - fix it and build it
  - the drafts and activity page does not work - build them
  - pinned poems should not be on main page, only in side panel
  - clicking bluetry logo does not reset pagination to page one.. it should just go home.
  - what does the email subscribe do? it should say subscribed after sending email to list in be

### more revisions
- we need to build out an admin section called poem management, this should list all published poems with buttons to edit a poem, unpublish a poem, pin or unpin a poem, delete a poem (with confirmation dialog popup)
- let's make the activity admin page the initial page when you log in. then we can remove the back to admin button from that page. and make sure we use the title of the poem with the activity when it is liked or used in an activity.
- the formatting isn't being used in the body of a poemcard. right now I just see the html tags <p></p>

### more revisions
- make sure ALL buttons on website are from mond-design-system
- when you click on content (text) of poemCard it should not be a link to individual poem card
- okay, I need you to analyze the colors and the fonts in portfolio-2023, then, use the tokens in the mond-design-system within the bluetry app. you need to match the background of the light and dark scheme, the fonts, and colors between portfolio-2023 in the bluetry app.

### more revisions
-  fix the favicon

## email subscriber management

## comments

- let's build the comments section of the site.
- users/viewers should be able to add comments to the poems.
- comments section should be expandable by an upside down chevron icon that flips when open.
- users should be able to like comments
- users should be able to reply to other comments and see the threads (indented)
- users should be able to report comments (send email to admin with report that includes poem title- linked- and comment contents)
- I should be able to delete comments (add button to delete comment when I am logged in)
- add comment activity to the admin activity page
- create filter for comments on admin activity page

#####

### Ice box ideas

## user profiles
## sign up button and sign up form
## user following
## user connection management
## pinning others poems?
## the wall/feed
## the front page-- with all the most popular poems of the week and newest poems and trending poems-- three columns (maybe most commented on poems/controversial poems)
## user report/blocking, comment report blocking
## notification button for alerts of activity - reports, likes, published by following
## personal profile page with pic
## hashtags and trending hashtags
## categories of poems
## saved poems
## reposting poems with comments



set up optin opt out user notificationt o receive an email every time a poem is published with the poem.

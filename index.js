"uso estricto";

require("dotenv").config();
const puppeteer = require("puppeteer");
const Instauto = require("instauto");
const options = {
    cookiesPath: "./database/cookies.json",
    username: process.env.INSTA_USERNAME,    //
    password: process.env.INSTA_PASSWORD,

    maxFollowsPerHour: 20,
    maxFollowsPerDay: 100,
    maxLikesPerDay: 150,
  
    followUserRatioMin: 0.8,
    followUserRatioMax: 5.0,
  
    followUserMaxFollowers: null,
    followUserMaxFollowing: null,
    followUserMinFollowers: null,
    followUserMinFollowing: null,
  
    dontUnfollowUntilTimeElapsed: 3 * 24 * 60 * 60 * 1000,
    excludeUsers: [],
  
    dryRun: false,
  };
  
  (async () => {
    let browser;
  
    try {
     
      const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: [`--window-size=800,736`], 
        defaultViewport: {
          width: 780, 
          height: 736, 
        },
      });
  
      //Crear BD Json para almacenar informacion
      const instautoDb = await Instauto.JSONDB({
        followedDbPath: "./database/followed.json",
        unfollowedDbPath: "./database/unfollowed.json",
        likedPhotosDbPath: "./database/liked-photos.json",
      });
  
      const instauto = await Instauto(instautoDb, browser, options);
  
      //Dejar de seguir a los que no te siguieron también
      await instauto.unfollowNonMutualFollowers();
      await instauto.sleep(10 * 60 * 1000);
  
      //Dejar de seguir aquellos que no te siguieron pasados 3 días
      const unfollowedCount = await instauto.unfollowOldFollowed({
        ageInDays: 3,
        limit: options.maxFollowsPerDay * (2 / 3),
      });
  
      if (unfollowedCount > 0) await instauto.sleep(10 * 60 * 1000);
  
      const usersToFollowFollowersOf = ["rosalia.vt", "chrisrock"];
  
      await instauto.followUsersFollowers({
        usersToFollowFollowersOf,
        maxFollowsTotal: options.maxFollowsPerDay - unfollowedCount,
        skipPrivate: true,
        enableLikeImages: true,
        likeImagesMax: 3,
      });
  
      await instauto.sleep(10 * 60 * 1000);
  
      console.log("Ejecucion realizada");
  
      await instauto.sleep(30000);
    } catch (err) {
      console.error(err);
    } finally {
      console.log("Cerrando navegador");
      if (browser) await browser.close();
    }
  })();
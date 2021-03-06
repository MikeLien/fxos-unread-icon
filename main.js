const ActionToAppMapping = {// pattern in notification event id: vertical home icon 
  'app://communications.gaiamobile.org/manifest.webapp#notag': 'app://communications.gaiamobile.org/manifest.webapp-dialer',
  'app://sms.gaiamobile.org/manifest.webapp#tag': 'app://sms.gaiamobile.org/manifest.webapp',
  'app://calendar.gaiamobile.org/manifest.webapp#tag:/alarm-display': 'app://calendar.gaiamobile.org/manifest.webapp',
  'app://email.gaiamobile.org/manifest.webapp#tag': 'app://email.gaiamobile.org/manifest.webapp',
  'app://system.gaiamobile.org/manifest.webapp#tag:screenshot': 'app://gallery.gaiamobile.org/manifest.webapp',
  "app://system.gaiamobile.org/manifest.webapp#tag:logshake": 'https://www.bzlite.com/manifest.webapp'
}

function notificatinIdToIconUrl(notificationId){
  for (var key in ActionToAppMapping){
    if (notificationId.contains(key)){
      return ActionToAppMapping[key];
    }
  }
}

function appUrlToQuerySelector(appUrl){
  return '.icon[data-identifier="' + appUrl + '"]';
}

function drawUnreadIcon(app_selector, number){
  var unread = document.getElementById(app_selector+"-unread");
  if (number == 0){
    if (unread != null){
      unread.parentNode.removeChild(unread);
    }
    return
  }
  else{
    if (number > 99){ number = "N" }
    if (unread != null){
      unread.innerHTML = number;
    }
    else {
      unread = document.createElement('div');
      unread.id = app_selector + "-unread";
      unread.style.width = "30px";
      unread.style.height= "30px";
      unread.style.backgroundColor = "red";
      unread.style.color = "white";
      unread.style.position = "fixed";
      unread.style.top= "0px";
      unread.style.right= "0px";
      unread.style.borderRadius = "100%";
      unread.style.fontSize= "2rem";
      unread.style.lineHeight= "150%";
      unread.appendChild(document.createTextNode(number));
      console.log(app_selector)
      console.log(document.querySelector(app_selector))
      if (document.querySelector(app_selector) != null){// in case the unreads is corrupted, but we should have some cleanup method
        document.querySelector(app_selector).appendChild(unread);
      }
    }
  }
}

function setUnreads(unreads){
  var lock = navigator.mozSettings.createLock();
  //TODO: change this to { "title": count }
  var setting_set = lock.set({
    'unreads': unreads
  });
  setting_set.onsuccess = function () {
    console.log("[UNREAD]the settings has been changed");
  }

  setting_set.onerror = function () {
    console.log("[UNREAD]An error occure, the settings remain unchanged");
  }
}

function increaseUnread(appUrl, incBy, defaultNum){
    console.log("[UNREAD] Increasing the unread count for " + appUrl + " by " + incBy);
    var unreads = {}
    var lock = navigator.mozSettings.createLock();
    var setting_get = lock.get('unreads');

    setting_get.onsuccess = function () {
      //console.log("[UNREAD] ", setting_get.result)
      //console.log("[UNREAD] ", setting_get.result.unreads)
      if (typeof setting_get.result.unreads === "undefined"){
        unreads[appUrl] = defaultNum
        setUnreads(unreads);
      }
      else {
        unreads = setting_get.result.unreads;
        //console.log(unreads)
        //console.log(unreads[evt.detail.title])
        if (appUrl in unreads){
          unreads[appUrl] += incBy;
        }
        else {
          unreads[appUrl] = defaultNum;
        }
      }
      setUnreads(unreads);
    }
    setting_get.onerror = function () {
        console.log("[UNREAD]An error occure, the settings remain unchanged");
    }
}

function setUnreadToNum(appUrl, defaultNum){
    console.log("[UNREAD] Setting the unread count for " + appUrl + " to " + defaultNum);
    var unreads = {}
    var lock = navigator.mozSettings.createLock();
    var setting_get = lock.get('unreads');

    setting_get.onsuccess = function () {
      //console.log("[UNREAD] ", setting_get.result)
      //console.log("[UNREAD] ", setting_get.result.unreads)
      if (typeof setting_get.result.unreads === "undefined"){
        unreads[appUrl] = defaultNum
      }
      else {
        unreads = setting_get.result.unreads;
        //console.log(unreads)
        //console.log(unreads[evt.detail.title])
        unreads[appUrl] = defaultNum;
      }
      setUnreads(unreads);
    }
    setting_get.onerror = function () {
        console.log("[UNREAD]An error occure, the settings remain unchanged");
    }
}

function increaseUnreadByOne(appUrl){
  increaseUnread(appUrl, 1, 1);
}


console.log("[UNREAD]I am running in ")
console.log(window.location)
console.log("[UNREAD] is in system :", window.location.toString().indexOf('system.gaiamobile.org') > 0) 
console.log("[UNREAD] is in homescreen:", window.location.toString().indexOf('verticalhome.gaiamobile.org') > 0) 
if (window.location.toString() === 'app://system.gaiamobile.org/index.html') {
  window.addEventListener('appopened', function(evt){
    console.log("[UNREAD] App opened: " + evt.detail.manifestURL)
    console.log(evt.type)
    console.log(evt.detail)
    console.log(evt.detail.type)
    //use evt.detail.manifestURL to clear 
    //FIXME: woraround
    if (evt.detail.manifestURL == 'app://communications.gaiamobile.org/manifest.webapp'){
      setUnreadToNum(evt.detail.manifestURL + "-dialer", 0)
      return 
    }
    setUnreadToNum(evt.detail.manifestURL, 0)
  });

  window.addEventListener('mozChromeNotificationEvent', function(evt){
    console.log("[UNREAD] Received notification")
    //TODO: if the title is not on the list, ignore

    var iconUrl = notificatinIdToIconUrl(evt.detail.id);
    if (typeof iconUrl != "undefined") {
      increaseUnreadByOne(iconUrl);
    }
    console.log(evt.detail)
  })
}

function refreshAllHomesceenIcons(evt){
  var lock    = navigator.mozSettings.createLock();
  var setting = lock.get('unreads');

  setting.onsuccess = function () {
    for (appUrl in setting.result.unreads){
      console.log("[UNREAD] ", "icon to be drawn ", appUrl)
      console.log("[UNREAD] ", "icon count to be drawn ", setting.result.unreads[appUrl])
      drawUnreadIcon(appUrlToQuerySelector(appUrl), setting.result.unreads[appUrl]);
    }
  }

  setting.onerror = function () {
    console.warn('[UNREAD]An error occured: ' + setting.error);
  }
}

//Use indexOf because the verticalhome will have a ID suffix:
//e.g app://verticalhome.gaiamobile.org/index.html#1234356789
//I'm not sure about the format of that ID, so don't know how to write a RegEx
if (window.location.toString().indexOf('app://verticalhome.gaiamobile.org/index.html') == 0) {
  window.navigator.mozSettings.addObserver('unreads', refreshAllHomesceenIcons);

  // If the addObserver breaks, use polling
  // window.setInterval(refreshAllHomescreenIcons, 10000);
}

refreshAllHomesceenIcons() //draw once when boot

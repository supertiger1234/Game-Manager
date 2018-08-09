const Store = require('electron-store');
var execFile = require('child_process').execFile,
    child;
const request = require('request'),
    url = 'https://www.jasonbase.com/things/WYJw.json'

const path = require('path')
const store = new Store();
var jsonGamesList;
var selectedItem;
var gamelistUpdated = false;
var totalMenus = []

var currentlySwitchingTimeOut = false;
if (typeof store.get("gamesList") == "undefined") {
    totalMenus.push({
        div: "addGameItem",
        name: "Add a game"
    })
    totalMenus.push({
        div: "settingsItem",
        name: "Settings"
    })
    store.set("gamesList", totalMenus)
} else {
    totalMenus = store.get("gamesList")

}

selectedItem = 0;
$(document).keydown(function (e) {

    if (gamelistUpdated == false){
        return;
    }
    if (currentScreen == "homeScreen") {

        if (e.keyCode == 13) {
            openGame();
        }

        if (currentlySwitchingTimeOut) {
            return;
        }
        if (e.keyCode == 39) {
            if (typeof totalMenus[selectedItem + 1] == "undefined") {
                return;
            }
            selectedItem++;
            $(".menuItem").removeClass("selectedMenuItem");
            $("#" + totalMenus[selectedItem].div).addClass("selectedMenuItem")

            changedMenuItem()

            $(".menuItems").animate({
                marginLeft: "-=330"
            }, 100, function () {
                currentlySwitchingTimeOut = false
            })


        } else if (e.keyCode == 37) {
            if (typeof totalMenus[selectedItem - 1] == "undefined") {
                return;
            }

            $(".menuItems").animate({
                marginLeft: "+=330"
            }, 100, function () {
                currentlySwitchingTimeOut = false
            })


            selectedItem--;

            $(".menuItem").removeClass("selectedMenuItem");
            $("#" + totalMenus[selectedItem].div).addClass("selectedMenuItem")

            changedMenuItem()


        }
    }

});

function changedMenuItem() {
    let message;
    let title;
    if (totalMenus[selectedItem].name == "Settings") {
        $('.backgroundImage').fadeOut(400);
        title = totalMenus[selectedItem].name
        message = "Change settings such as themes, background and more."
    } else if (totalMenus[selectedItem].name == "Add a game") {
        $('.backgroundImage').fadeOut(400);
        title = totalMenus[selectedItem].name
        message = "To add a game, click on this icon and Choose an executable file."
    } else {


        $('<img/>').attr('src', totalMenus[selectedItem].background[0]).on('load', function () {
            $(this).remove(); // prevent memory leaks as @benweet suggested
            $('.backgroundImage').fadeOut(400, function () {
                $('.backgroundImage').css('background-image', 'linear-gradient(rgba(0, 0, 0, 0.7),rgba(0, 0, 0, 0.7)),url(' + getRandomArray(totalMenus[selectedItem].background) + ')');

                setTimeout(() => {
                    $('.backgroundImage').fadeIn(300);
                }, 400);
            });

        });

        title = totalMenus[selectedItem].name
        message = totalMenus[selectedItem].description
    }

    $(".menuItemDetail").fadeOut(300, function () {
        $(".menuDetailTitle").text(title)
        $(".menuDetailMessage").text(message)
        $(".menuItemDetail").fadeIn(300)
    })
}

function openGame() {
    if (totalMenus[selectedItem].name == "Add a game") {

        request(url, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                jsonGamesList = JSON.parse(body)
                $(".addGame").fadeIn();
                console.log("Got a response ")
            } else {
                console.log("Got an error: ", error, ", status code: ", response.statusCode)
                $('.somethingWentWrongPopout').fadeIn()
            }
        })


    } else {

        child = execFile(totalMenus[selectedItem].path, function (error, stdout, stderr) {
            if (error) {
                //console.log(error.stack); 
                //console.log('Error code: '+ error.code); 
                //console.log('Signal received: '+ 
                //       error.signal);
            }
            //console.log('Child Process stdout: '+ stdout);
            //console.log('Child Process stderr: '+ stderr);
        });
        child.on('exit', function (code) {
            //console.log('Child process exited '+
            //    'with exit code '+ code);
            //alert('exit');
            // Load native UI library
            console.log("closed");

        });
    }
}
updateGamesList()

function updateGamesList() {

    if (totalMenus.length <= 2) {
        return;
    }

    AddToNotificationQueue("Game List", "Updating games list...", "icon")
    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            let newGameList = JSON.parse(body)

            for (var field in newGameList) {
                for (var i in totalMenus) {
                    if (field == totalMenus[i].name) {
                        totalMenus[i].background = newGameList[field].background
                        totalMenus[i].logo = newGameList[field].logo
                        totalMenus[i].description = newGameList[field].description
                    }
                }
            }
            store.set("gamesList", totalMenus)
            AddToNotificationQueue("Game List", "Game list update successful!", "icon")
            gamelistUpdated = true;
            console.log("Got a response ")
            AddGamesToDiv()
        } else {
            console.log("Got an error: ", error, ", status code: ", response.statusCode)
            AddToNotificationQueue("Game List", "Game list update has failed.", "icon")
            gamelistUpdated = true;
            AddGamesToDiv()

        }
    })
}

function AddGamesToDiv() {
    for (let index = 0; index < totalMenus.length; index++) {
        const element = totalMenus[index];
        if (index > 1) {
            $(".menuItems").append('<div class="menuItem" game="' + element.name + '" style="background-image: url(' + element.icon + ');background-size: 100%;background-position: center;background-repeat: no-repeat;" id="' + element.div + '"><div style="margin-top: 300px;" class="title">Start</div></div>')

        }
    }
}

function getRandomArray(arr) {
    if (typeof arr == "undefined"){
        return "";
    }
    return arr[Math.floor(Math.random() * (arr.length))]
}
/***********************************************************************************
  Simple
  by Scott Kildall

  Uses the p5.2DAdventure.js class 

  To do:
  ** cleanup p5.2DAdventure.js class + document it
  ** add mouse events, other interactions
  ** finish MazeMapper
  
------------------------------------------------------------------------------------
	To use:
	Add this line to the index.html

  <script src="p5.2DAdventure.js"></script>
***********************************************************************************/

// adventure manager global  
var adventureManager;

// p5.pla7
var playerSprite;
var playerAnimation;

// Clcikables: the manager class
var clickablesManager;    // the manager class
var clickables;           // an array of clickable objects

// indexes into the array (constants)
const playGameIndex = 0;
const chooseAvatarIndex = 1;
const doneIndex = 2;

var avatarAnimations = [];
var selectedAvatarAnimation = 0;  // default to zero

// Allocate Adventure Manager with states table and interaction tables
function preload() {
  clickablesManager = new ClickableManager('data/clickableLayout.csv');
  adventureManager = new AdventureManager('data/adventureStates.csv', 'data/interactionTable.csv', 'data/clickableLayout.csv');

  // load all our potential avatar animations here
  avatarAnimations[0] = loadAnimation('assets/avatars/blueblob-01.png', 'assets/avatars/blueblob-05.png');
  avatarAnimations[1] = loadAnimation('assets/avatars/bubbly0001.png', 'assets/avatars/bubbly0004.png');
  avatarAnimations[2] = loadAnimation('assets/avatars/rocks0.png', 'assets/avatars/rocks3.png');
}

// Setup the adventure manager
function setup() {
  createCanvas(960, 720);

  // setup the clickables = this will allocate the array
  clickables = clickablesManager.setup();

 
    // create a sprite and add the 3 animations
  playerSprite = createSprite(width/2, height/2, 80, 80);
  
  // use this to track movement from toom to room in adventureManager.draw()
  adventureManager.setPlayerSprite(playerSprite);

  // this is optional but will manage turning visibility of buttons on/off
  // based on the state name in the clickableLayout
  adventureManager.setClickableManager(clickablesManager);

    // This will load the images, go through state and interation tables, etc
  adventureManager.setup();

  // call OUR function to setup additional information about the p5.clickables
  // that are not in the array 
  setupClickables(); 
}

// Adventure manager handles it all!
function draw() {
  // draws background rooms and handles movement from one to another
  adventureManager.draw();

  // draw the p5.clickables, in front of the mazes but behind the sprites 
  clickablesManager.draw();

  // No avatar for Splash screen or Instructions screen
  if( adventureManager.getStateName() !== "Splash" && 
      adventureManager.getStateName() !== "Instructions" &&  
      adventureManager.getStateName() !== "AvatarSelection" ) {
      
      // responds to keydowns
    moveSprite();

    // this is a function of p5.js, not of this sketch
    drawSprites();
  } 
}

// pass to adventure manager, this do the draw / undraw events
function keyPressed() {
  // toggle fullscreen mode
  if( key === 'f') {
    fs = fullscreen();
    fullscreen(!fs);
    return;
  }

  // dispatch key events for adventure manager to move from state to 
  // state or do special actions - this can be disabled for NPC conversations
  // or text entry   

 // an example of when we are trapping events for certain screens
  if( adventureManager.getStateName() === "AvatarSelection" ) {
    if( key === '1' || key === '2' || key === '3') {
      // convert to array index, e.g. '2' --> 2 - 1 = [1]
      selectedAvatarAnimation = parseInt(key) - 1;
    }
  }

  else {
    // dispatch to elsewhere
    adventureManager.keyPressed(key); 
  }
}


function mouseReleased() {
  adventureManager.mouseReleased();
}

//-------------- YOUR SPRITE MOVEMENT CODE HERE  ---------------//
function moveSprite() {
  if(keyIsDown(RIGHT_ARROW))
    playerSprite.velocity.x = 10;
  else if(keyIsDown(LEFT_ARROW))
    playerSprite.velocity.x = -10;
  else
    playerSprite.velocity.x = 0;

  if(keyIsDown(DOWN_ARROW))
    playerSprite.velocity.y = 10;
  else if(keyIsDown(UP_ARROW))
    playerSprite.velocity.y = -10;
  else
    playerSprite.velocity.y = 0;
}

//-------------- CLICKABLE CODE  ---------------//

function setupClickables() {
  // All clickables to have same effects
  for( let i = 0; i < clickables.length; i++ ) {
    clickables[i].onHover = clickableButtonHover;
    clickables[i].onOutside = clickableButtonOnOutside;
    clickables[i].onPress = clickableButtonPressed;
  }
}

// tint when mouse is over
clickableButtonHover = function () {
  this.color = "#AA33AA";
  this.noTint = false;
  this.tint = "#FF0000";
}

// color a light gray if off
clickableButtonOnOutside = function () {
  // backto our gray color
  this.color = "#AAAAAA";
}

clickableButtonPressed = function() {
  // these clickables are ones that change your state
  // so they route to the adventure manager to do this
  if( this.id === playGameIndex || this.id === chooseAvatarIndex || this.id === doneIndex ) {
      adventureManager.clickablePressed(this.name);
  } 

  // add animation to the player sprite once we start the game
  if( this.id === playGameIndex ) {
    playerSprite.addAnimation('regular', avatarAnimations[selectedAvatarAnimation]);
  }

  // Other non-state changing ones would go here.
}



//-------------- SUBCLASSES / YOUR DRAW CODE CAN GO HERE ---------------//

// Instructions screen has a backgrounnd image, loaded from the adventureStates table
// It is sublcassed from PNGRoom, which means all the loading, unloading and drawing of that
// class can be used. We call super() to call the super class's function as needed
class InstructionsScreen extends PNGRoom {
  // Constructor gets calle with the new keyword, when upon constructor for the adventure manager in preload()
  constructor() {
    super();    // call super-class constructor to initialize variables in PNGRoom

    this.textBoxWidth = (width/6)*4;
    this.textBoxHeight = (height/6)*4; 

    // hard-coded, but this could be loaded from a file if we wanted to be more elegant
    this.instructionsText = "You are navigating through the interior space of your moods. There is no goal to this game, but just a chance to explore various things that might be going on in your head. Use the ARROW keys to navigate your avatar around.";
  }

  // call the PNGRoom superclass's draw function to draw the background image
  // and draw our instructions on top of this
    draw() {
      // tint down background image so text is more readable
      tint(128);
      
      // this calls PNGRoom.draw()
      super.draw();
      
      // text draw settings
      fill(255);
      textAlign(CENTER);
      textSize(30);

      // Draw text in a box
      text(this.instructionsText, width/6, height/6, this.textBoxWidth, this.textBoxHeight );
    }
}

// Subclass of PNGRoom, also uses global variables from this
// sketch (unorthodox, but ok)
class AvatarSelectionScreen extends PNGRoom {
  // Constructor gets calle with the new keyword, when upon constructor for the adventure manager in preload()
  constructor() {
    super();    // call super-class construtor

    // change the displau text
    this.textBoxWidth = (width/6)*4;
    this.textBoxHeight = (height/6)*4; 

    this.instructionsText = "Choose your avatar\nType [1] for Birdy\nType [2] for Bubbly\nType [3] for Rocks";
  }

  draw() {
      // this calls PNGRoom.draw()
      super.draw();
      
      push();
      // text draw settings
      fill(240,120,0);
      textAlign(CENTER);
      textSize(30);

      // Draw text in a box
      text(this.instructionsText, width/6, height/6, this.textBoxWidth, this.textBoxHeight );
    
      let xStart = 500;
      let xDist = 150;
      let yPos = 350;
      for( let i = 0; i < avatarAnimations.length; i++ ) {
        avatarAnimations[i].draw( xStart + (i*xDist), yPos);
      }

      // draw little ellipse thing
      fill('#FF0000');
      ellipseMode(CENTER);
      circle(xStart+ (selectedAvatarAnimation*xDist), yPos + 65, 10 );

      pop();

    }

    drawSelectionTriangle() {
      selectedAvatarAnimation
    }
}


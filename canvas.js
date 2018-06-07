var canvas = document.getElementById('main');
var canvasbg = document.getElementById('background');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var c = canvas.getContext('2d');
canvasbg.width = window.innerWidth;
canvasbg.height = window.innerHeight;
var c2 = canvasbg.getContext('2d');
W = canvas.width;
H = canvas.height;

var instructions = document.getElementById('instructions');
var head = document.getElementById('head');

var bg = new Image();
bg.src = "grass.png";
bg.onload = function() {
  var pat = c2.createPattern(bg,'repeat');
  c2.rect(0, 0, W, H);
  c2.fillStyle = pat;
  c2.fill();
}


var spacePressed = false;
var spaceDone = false;
var level = 1;
var score = 0;
var health = 100;
var frame = 1;
var game_over = false;
var game_speed = 3;
var started = false;
var kills = 0;

var mouse = {
  x : undefined,
  y : undefined
};

window.addEventListener('mousemove', function(e){
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('keydown', function(e){
  if(!started){
    started = true;
    instructions.style.display = 'none';
    head.style.display = 'none';
    startGame();
  }
  if(e.key == ' ' && !spaceDone){
    spacePressed = true;
  }
  if(game_over && e.key == 'r'){
    location.reload();
  }
});
window.addEventListener('keyup', function(e){
  if(e.key == ' '){
    spacePressed = false;
    spaceDone = false;
  }
});

function randInt(l, r){   // returns random integer from l to r
  var x = Math.random()*(r-l) + l;
  return parseInt(x.toFixed(0));
}

function Wall(x, y, height){
  this.height = height;
  this.width = W/15;
  this.x = x;
  this.y = y;
  this.speed = game_speed;
  this.rightmost = true;
  this.wall = new Image();
  this.wall.src = 'wall.png';
  this.draw = function(){
    // c.beginPath();
    // c.fillRect(this.x, this.y, this.width, this.height);
    // c.closePath();
    c.drawImage(this.wall, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
  }
  this.update = function(){
    this.x -= this.speed;
    this.draw();
  }
}

function generateWalls(){
  var min_gap = character.height*1.2;
  var gap_height = [];
  var gap_y = [];
  var no_of_gaps = randInt(1,3);
  while(gap_y.length < no_of_gaps){
    var h = randInt(min_gap, min_gap*1.6);
    var y = randInt(0, H - h);
    var l = gap_y.length;
    if(l==0){
      gap_y.push(y);
      gap_height.push(h);
    }
    else{
      var insert = 0;
      var j =0;
      for(j=0; j<l; ++j){
        if((y > (gap_y[j] + gap_height[j])) || ((y + h) < gap_y[j])){}
        else{
          insert = 1;
        }
      }
      if(insert != 1){
        gap_y.push(y);
        gap_height.push(h);
      }
    }
  }
  for(var i = 0; i<gap_height.length; ++i){
    for(var j=i+1; j<gap_height.length; ++j ){
      if(gap_y[i] > gap_y[j]){
        var temp1 = gap_y[i];
        gap_y[i] = gap_y[j];
        gap_y[j] = temp1;
        var temp2 = gap_height[i];
        gap_height[i] = gap_height[j];
        gap_height[j] = temp2;
      }
    }
  }
  walls.push(new Wall(W, 0, gap_y[0]));
  for(var i=1; i<gap_y.length; ++i){
    walls.push(new Wall(W, gap_y[i-1]+gap_height[i-1], gap_y[i]-gap_y[i-1]-gap_height[i-1]));
  }
  walls.push(new Wall(W, gap_y[gap_y.length-1]+gap_height[gap_y.length-1],H));
  var p = Math.random();
  if(p > 0.7){
    var enemy = new Enemy(W + walls[walls.length-1].width + (W/3 - walls[walls.length-1].width - 64)*Math.random(), Math.random()*(H - 50) + 50, walls[walls.length-1].speed);
    enemy.init();
    enemies.push(enemy);
  }

}

function Character(){
  this.x = W/5;
  this.y = H/2;
  this.angle = 0;
  this.scale = 1.3;
  this.speed = 4;
  this.walk_sprite_width = 210;
  this.walk_sprite_height = 57;
  this.run_sprite_width = 480;
  this.run_sprite_height = 87;
  this.walk_width = 210/6;
  this.run_width = 480/6;
  this.width = this.walk_width*this.scale;
  this.height = this.walk_sprite_height*this.scale;
  this.cx = this.x + this.width/2;
  this.cy = this.y + this.height/2;
  this.walk_curFrame = 0;
  this.walk_frameCount = 6;
  this.run_curFrame = 0;
  this.run_frameCount = 6;
  this.frame_rate = 9;
  this.count_frame = 0;
  this.shiftX = 10;
  this.shiftY = 15;
  this.walk = new Image();
  this.walk.src = "walk.png";
  this.run = new Image();
  this.run.src = "run.png";

  this.updateWalkFrame = function() {
    this.walk_curFrame = ++this.walk_curFrame % 6;
    this.walk_srcX = this.walk_curFrame*this.walk_width;
  }
  this.drawWalk = function(){
    if(this.count_frame == 0){
      this.updateWalkFrame();
    }
    this.count_frame++;
    this.count_frame %= this.frame_rate;
    c.translate(this.cx, this.cy);
    c.rotate(this.angle);
    c.translate(-this.width/2, -this.height/2);
    c.drawImage(this.walk, this.walk_srcX, 9, this.walk_width, this.walk_sprite_height - 2*7, 0, 0, this.width, this.height);
    // c.strokeRect(0, 0, this.width, this.height);
    c.translate(this.width/2, this.height/2);
    c.rotate(-this.angle);
    c.translate(-this.cx,-this.cy);
  }
  this.calcAngle = function() {
    var slope = (mouse.y - this.cy)/(mouse.x - this.cx);
    this.angle = Math.atan(slope);
    if(mouse.x < this.cx){
      this.angle += Math.PI;
    }
  }
  this.updateRunFrame = function() {
    this.run_curFrame = ++this.run_curFrame % 6;
    this.run_srcX = this.run_curFrame*this.run_width + this.shiftX;
  }

  this.drawRun = function() {
    if(this.count_frame == 0){
      this.updateRunFrame();
    }
    this.count_frame++;
    this.count_frame %= this.frame_rate;
    c.translate(this.cx, this.cy);
    c.rotate(this.angle);
    c.translate(-this.width*1.7/2, -this.height/2);
    c.drawImage(this.run, this.run_srcX, this.shiftY + 9, this.run_width - 2*this.shiftX, this.run_sprite_height - 2*(this.shiftY + 7), 0, 0, this.width*1.7, this.height);
    // c.strokeRect(0, 0, this.width*1.7, this.height);
    c.translate(this.width*1.7/2, this.height/2);
    c.rotate(-this.angle);
    c.translate(-this.cx,-this.cy);
  }

  this.draw = function() {
    if(mouse.x){
      this.calcAngle();
      var dist = distance(mouse.x, mouse.y, this.cx, this.cy);
      if(dist <= this.height){
        this.drawWalk();
      }
      else{
        this.update();
        this.drawRun();
      }
    }
    else{
      this.drawWalk();
    }
  }
  this.update = function(){
    this.dx = this.speed*Math.cos(this.angle);
    this.dy = this.speed*Math.sin(this.angle);
    this.cx += this.dx;
    this.cy += this.dy;
  }
  this.shoot = function() {
    if(spacePressed){
      var dv = 9;
      var bullet = new CharacterBullet(this.cx, this.cy, dv*Math.cos(this.angle), dv*Math.sin(this.angle), this.angle);
      character_bullets.push(bullet);
      spaceDone = true;
      spacePressed = false;
    }
  }
}

function Enemy(x, y, dx){
  this.x = x;
  this.y = y;
  this.scale = 1.3;
  this.dx = -dx;
  this.damaged = false;
  this.shoot_sprite_width = 228;
  this.shoot_sprite_height = 45;
  this.die_sprite_width = 196;
  this.die_sprite_height = 54;
  this.shoot_width = 228/6;
  this.die_width = 196/4;
  this.width = this.die_width*this.scale;
  this.height = this.die_sprite_height*this.scale;
  this.cx = this.x + this.width/2;
  this.cy = this.y + this.height/2;
  this.shoot_curFrame = 0;
  this.shoot_frameCount = 6;
  this.die_curFrame = 0;
  this.die_frameCount = 4;
  this.frame_rate = 9;
  this.count_frame = 0;
  this.shootFrame = 120;
  this.count_shootFrame = 0;
  this.dead = false;

  this.shoot = new Image();
  this.shoot.src = 'enemy_shoot.png';
  this.die = new Image();
  this.die.src = 'enemy_die.png';

  this.init = function() {
    var r = Math.random();
    if(r > 0.5){
      this.dy = -2;
      this.angle = -(Math.PI)/2;
    }
    else{
      this.dy = 2;
      this.angle = (Math.PI)/2;
    }
  }

  this.updateShootFrame = function() {
    this.shoot_curFrame = ++this.shoot_curFrame % 6;
    this.shoot_srcX = this.shoot_curFrame*this.shoot_width;
  }
  this.drawShoot = function() {
    if(this.count_frame == 0){
      this.updateShootFrame();
    }
    this.count_frame++;
    this.count_frame %= this.frame_rate;
    c.translate(this.cx, this.cy);
    c.rotate(this.angle);
    c.translate(-this.width/2, -this.height/2);
    c.drawImage(this.shoot, this.shoot_srcX, 0, this.shoot_width, this.shoot_sprite_height, 0, 0, this.width, this.height);
    c.translate(this.width/2, this.height/2);
    c.rotate(-this.angle);
    c.translate(-this.cx,-this.cy);
  }
  this.updateDieFrame = function() {
    if(this.die_curFrame < 3){
      this.die_curFrame++;
    }
    this.die_srcX = this.die_curFrame*this.die_width;
  }
  this.drawDie = function() {
    if(this.count_frame == 0){
      this.updateDieFrame();
    }
    this.count_frame++;
    this.count_frame %= this.frame_rate;
    c.translate(this.cx, this.cy);
    c.rotate(this.angle);
    c.translate(-this.width/2, -this.height/2);
    c.drawImage(this.die, this.die_srcX, 0, this.die_width, this.die_sprite_height, 0, 0, this.width, this.height);
    c.translate(this.width/2, this.height/2);
    c.rotate(-this.angle);
    c.translate(-this.cx,-this.cy);
  }
  this.update = function() {
    if(this.cy < this.height/2){
      this.dy = 2;
      this.angle = Math.PI/2;
    }
    else if(H - this.cy < this.height/2){
      this.dy = -2;
      this.angle = -Math.PI/2;
    }
    if(!this.dead){
      this.cy += this.dy;
    }
    this.cx += this.dx;
  }
  this.draw = function() {
    this.update();
    if(!this.dead){
      this.drawShoot();
    }
    else{
      this.drawDie();
    }
  }
  this.Shoot = function() {
    this.count_shootFrame = ++this.count_shootFrame % this.shootFrame;
    if(this.count_shootFrame == 0){
      if(this.dy < 0){
        var y = this.cy - this.height/2;
        var dy = this.dy - 3;
        var x = this.cx + this.width/10;
      }
      else{
        var y = this.cy + this.height/2;
        var dy = this.dy + 3;
        var x = this.cx + this.width/20;
      }
      var bullet = new EnemyBullet(x, y, this.dx, dy, this.angle);
      enemy_bullets.push(bullet);
    }
  }
}

function CharacterBullet(x, y, dx, dy, angle){
  this.cx = x;
  this.cy = y;
  this.dx = dx;
  this.dy = dy;
  this.scale = 1;
  this.width = 32*this.scale;
  this.height = 32*this.scale;
  this.angle = angle + Math.PI/2;
  this.bullet = new Image();
  this.bullet.src = 'bullet_3.png';
  this.draw = function() {
    this.update();
    c.translate(this.cx, this.cy);
    c.rotate(this.angle);
    c.translate(-this.width/2, -this.height/2);
    c.drawImage(this.bullet, 0, 0, 32, 32, 0, 0, this.width, this.height);
    c.translate(this.width/2, this.height/2);
    c.rotate(-this.angle);
    c.translate(-this.cx,-this.cy);
  }
  this.update = function() {
    this.cy += this.dy;
    this.cx += this.dx;
  }
}

function EnemyBullet(x, y, dx, dy, angle){
  this.cx = x;
  this.cy = y;
  this.dx = dx;
  this.dy = dy;
  this.scale = 1.2;
  this.width = 16*this.scale;
  this.height = 16*this.scale;
  this.angle = angle + Math.PI/2;
  this.bullet = new Image();
  this.bullet.src = 'bullet_1.png';
  this.damaged = false;
  this.draw = function() {
    this.update();
    c.translate(this.cx, this.cy);
    c.rotate(this.angle);
    c.translate(-this.width/2, -this.height/2);
    c.drawImage(this.bullet, 0, 0, 16, 16, 0, 0, this.width, this.height);
    c.translate(this.width/2, this.height/2);
    c.rotate(-this.angle);
    c.translate(-this.cx,-this.cy);
  }
  this.update = function() {
    this.cy += this.dy;
    this.cx += this.dx;
  }
}

function distance(x1, y1, x2, y2){
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function startGame(){
  character = new Character();
  walls = [];
  enemies = [];
  enemy_bullets = [];
  character_bullets = [];
  generateWalls();
}

function updateWalls(){
  var wall_dist = W/3;
  var i=0;
  var generate = false;
  for(i=0; i<walls.length; ++i){
    if(walls[i].rightmost && walls[i].x <= W-wall_dist){
      generate = true;
      walls[i].rightmost = false;
    }
    if(walls[i].x + walls[i].width <= 0){
      walls.splice(i, 1);
    }
  }
  for(var i=0; i< enemies.length; ++i){
    if(enemies[i].cx + enemies[i].width/2 < 0){
      enemies.splice(i, 1);
    }
  }
  for(var i=0; i<enemy_bullets.length; ++i){
    if(enemy_bullets[i].cx < 0){
      enemy_bullets.splice(i,1);
    }
  }
  if(generate){
    generateWalls();
  }
}

function updateLevel(){
  ++game_speed;
  walls.forEach(function(wall) {
    wall.speed = game_speed;
  });
  enemies.forEach(function(enemy) {
    enemy.dx = -game_speed;
  });
}

function collisionDetect(){
  var x = character.cx + character.width/2;
  var y = character.cy;

  walls.forEach(function(wall){
    if(x > wall.x && x < wall.x + wall.width){
      if(y > wall.y && y < wall.y + wall.height){
        if(x - wall.x < 15){
          character.cx = wall.x-1 - character.width/2;
        }
        else if(wall.x + wall.width - x < 15) {
          character.cx = wall.x + wall.width + 1 - character.width/2;
        }
        if(y - wall.y < 15){
          character.cy = wall.y -1;
        }
        else if(wall.y + wall.height - y < 15){
          character.cy = wall.y + wall.height + 1;
        }
      }
    }

  });
  x = character.cx;
  enemies.forEach(function(enemy) {
    var d = distance(x, y, enemy.cx, enemy.cy);
    if(d < character.width*1.3/2 && !enemy.dead && !enemy.damaged){
      health -= 10;
      enemy.damaged = true;
    }
    else if(d >= character.width/2){
      enemy.damaged = false;
    }
  });
  enemy_bullets.forEach(function(bullet) {
    var d = distance(x, y, bullet.cx, bullet.cy);
    if(d < character.width/2 && !bullet.damaged){
      health -=20;
      bullet.damaged = true;
    }
    else if(d >= character.width/2){
      bullet.damaged = false;
    }
  });
  character_bullets.forEach(function(bullet) {
    enemies.forEach(function(enemy) {
      var d = distance(bullet.cx, bullet.cy, enemy.cx, enemy.cy);
      if(d < enemy.width/2 && !enemy.dead){
        ++kills;
        enemy.dead = true;
        enemy.count_frame = 0;
      }
    });
  });
  if(character.cx + character.width/2 < 0){
    gameOver();
  }
}


function gameOver(){
  game_over = true;
  c.font = '50px custom';
  c.fillStyle = 'white';
  c.fillText('GAME OVER!!', W/3,H/3);
    c.font = '30px custom';
  c.fillText('Score : '+score, W/3, H/2);
  c.fillText('Level : '+level, W/3, H/2 + 50);
  c.fillText('Kills : '+kills, W/3, H/2 + 100);
  c.fillText('Press r to play again', W/3, H/2 + 200);
}

function showStats(){
  c.font = '20px custom';
  c.fillStyle = 'white';
  c.fillText('Score : '+score, 8*W/10, 60);
  c.fillText('Level : '+level, 8*W/10, 110);
  c.fillText('Kills : '+kills, W/16, 130);

  c.beginPath();
  c.fillText('Health :', W/16, 50);
  c.rect(W/16, 70, 200, 20);
  c.strokeStyle = 'white';
  c.stroke();
  var g = 255*health/100;
  var r = 255 - g;
  if(health > 0){
    c.beginPath();
    c.rect(W/16, 70, health*2, 20);
    c.fillStyle = 'rgba('+r+','+g+',0,1)';
    c.fill();
  }

}

function animate(){
  requestAnimationFrame(animate);
  c.clearRect(0,0,W,H);
  if(started && !game_over){
    frame = ++frame % 2000;
    if(health <= 0){
      gameOver();
    }
    if(frame % 20 == 0 && !game_over){
      ++score;
    }
    if(frame % (20*30) ==0 && !game_over){
      ++level;
      updateLevel();
    }
    updateWalls();
    for(var i = 0; i<walls.length; ++i){
      walls[i].update();
    }
    character.draw();
    collisionDetect();
    if(enemies.length > 0){
      enemies.forEach(function(enemy) {
        enemy.draw();
        if(!enemy.dead){
          enemy.Shoot();
        }
      });
    }
    if(enemy_bullets.length > 0){
      enemy_bullets.forEach(function(bullet) {
        bullet.draw();
      });
    }
    character.shoot();
    character_bullets.forEach(function(bullet) {
      bullet.draw();
    });
    showStats();
  }
  if(game_over){
    gameOver();
  }
}

// startGame();
animate();

//destroy player bullets
//enemy dead animation

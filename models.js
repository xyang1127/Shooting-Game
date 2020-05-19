var wall = [];
var player = [];
var enemys = [];
var Ebullets = [];
var Pbullets = [];
var lastKey = 'w';
var row = 40;
var col = 40;
const unit = 0.2;

function gameStart() {
    buildWalls(row, col);
    createPlayer();
    createEnemy();
    setInterval(function(){ enemyMove(); render();}, 100);
    setInterval(function(){ bulletMove(Pbullets); bulletMove(Ebullets); render();}, 10);
    render();
}

function buildWalls(row, col) {
    var i, j;
    var up = col / 2;
    var bottom = -col / 2;
    var left = -row / 2;
    var right = row / 2;

    for(i = left; i <= right; i++) {
        for(j = bottom; j <= up; j++) {
            if (i === left || i === right || j === up || j === bottom || (i === -6 && j<=10 && j>=-10) || (i === 6 && j<=10 && j>=-10) )  {
                for(k = 0; k<4; k++) {
                    wall.push(new WallBrick(i * unit, j * unit, k * unit, new vec3.fromValues(0, 0, 0.8)));
                }
            }
        }
    }

}

function render() {
    // clear frame/depth buffers
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(!isAlive() || enemys.length==0) {
        var audio = new Audio('die.mp3');
        audio.play();
        initializePosition();
    }

    deleteEBulletsOutOfBound();
    deletePBulletsOutOfBound();
    eliminateEnemy();
    drawStuff(wall);
    drawStuff(player);
    drawStuff(enemys);
    drawStuff(Pbullets);
    drawStuff(Ebullets);
}

function drawStuff(stuff) {
    for(var i = 0; i < stuff.length; i++) {
        var tMatrix = mat4.create();
        var tVector = new vec3.fromValues(stuff[i].x, stuff[i].y, stuff[i].z);
        mat4.translate(tMatrix, tMatrix, tVector);
        drawOneCube(tMatrix, stuff[i].type, stuff[i].color);
    }
}


function createPlayer() {
    player.push(new Player(0.2, 0, 0, new vec3.fromValues(0.8,0.8,0)));
}

function createEnemy() {

    enemys.push(new Enemy(13 * unit, 10 * unit, 0 * unit, new vec3.fromValues(0.5, 0, 0), -1, false));
    enemys.push(new Enemy(-13 * unit, -10 * unit, 0 * unit, new vec3.fromValues(0.5, 0, 0), 1, false));
    enemys.push(new Enemy(0 * unit, 10 * unit, 0 * unit, new vec3.fromValues(0.5, 0, 0), -1, false));
    enemys.push(new Enemy(-16 * unit, 16 * unit, 0 * unit, new vec3.fromValues(0.5, 0, 0), 1, true));
    enemys.push(new Enemy(16 * unit, -16 * unit, 0 * unit, new vec3.fromValues(0.5, 0, 0), 1, true));
}

function enemyMove() {

    for (i = 0; i < enemys.length; i++) {
        var ran = Math.random();
        
        var curBullet = [];

        if(ran >= 0.9)
            curBullet.push(new Bullet(enemys[i].x, enemys[i].y, enemys[i].z, new vec3.fromValues(0.8, 0, 0.8), false, false));

        if(!enemys[i].dirX) {
            enemys[i].y += unit * enemys[i].dir;
            if(enemys[i].y >= 3.8 || enemys[i].y <= -3.8)
            enemys[i].dir *= -1;
            if(curBullet.length > 0) {
                if(enemys[i].dir == 1) {
                    curBullet[0].dirPositive = true;
                    curBullet[0].dirX = false;
                } else {
                    curBullet[0].dirPositive = false;
                    curBullet[0].dirX = false;
                }
            }
        } else {
            enemys[i].x += unit * enemys[i].dir;
            if(enemys[i].x >= 3.8 || enemys[i].x <= -3.8)
            enemys[i].dir *= -1;
            if(curBullet.length > 0) {
                if(enemys[i].dir == 1) {
                    curBullet[0].dirPositive = true;
                    curBullet[0].dirX = true;
                } else {
                    curBullet[0].dirPositive = false;
                    curBullet[0].dirX = true;
                }
            }
        }

        if(curBullet.length > 0)
            Ebullets.push(curBullet[0]);
    }

}

function eliminateEnemy() {

    var surviveBullets = [];
    var surviveEnemys = [];
    for(i = 0; i < Pbullets.length; i++) {
        var collid = false;
        for(j = 0; j < enemys.length; j++) {
            if ((Math.abs(Pbullets[i].x - enemys[j].x) < 0.001) && (Math.abs(Pbullets[i].y - enemys[j].y)) < 0.001 && (Math.abs(Pbullets[i].z - enemys[j].z)) < 0.001) {
                collid = true;
                continue;
            }
        }
        if(collid) {
            var audio = new Audio('enemyDie.mp3');
            audio.play();
            continue;
        }
        else
            surviveBullets.push(Pbullets[i]);
    }

    for(j = 0; j < enemys.length; j++) {
        var collid = false;
        for(i = 0; i < Pbullets.length; i++) {
            if ((Math.abs(Pbullets[i].x - enemys[j].x) < 0.001) && (Math.abs(Pbullets[i].y - enemys[j].y)) < 0.001 && (Math.abs(Pbullets[i].z - enemys[j].z)) < 0.001) {
                collid = true;
                continue;
            }
        }
        if(collid)
            continue;
        else
            surviveEnemys.push(enemys[j]);
    }

    Pbullets = surviveBullets;
    enemys = surviveEnemys;
}

function deletePBulletsOutOfBound() {

    var toSave = [];
    for (i = 0; i < Pbullets.length; i++) {
        if(Pbullets[i].x<=-4 || Pbullets[i].x>=4 || Pbullets[i].y<=-4 || Pbullets[i].y>=4)
            continue;
        toSave.push(Pbullets[i]);
    }
    Pbullets = toSave;

}

function handleKeyDown(event) {

    switch (event.charCode) {
        case 119:
            player[0].x = player[0].x - unit;
            lastKey = 'w';
            break;
        case 97:
            player[0].y = player[0].y - unit;
            lastKey = 'a';
            break;
        case 115:
            player[0].x = player[0].x + unit;
            lastKey = 's';
            break;
        case 100:
            player[0].y = player[0].y + unit;
            lastKey = 'd';
            break;
        case 32:
            var audio = new Audio('shoot.mp3');
            audio.play();
            var curBullet = new Bullet(player[0].x, player[0].y, player[0].z, new vec3.fromValues(0, 0.8, 0), false, false);
            switch (lastKey) {
                case 'w':
                    curBullet.dirPositive = false;
                    curBullet.dirX =true;
                    break;
                case 'a':
                    curBullet.dirPositive = false;
                    curBullet.dirX = false;
                    break;
                case 's':
                    curBullet.dirPositive = true;
                    curBullet.dirX = true;
                    break;
                case 'd':
                    curBullet.dirPositive = true;
                    curBullet.dirX = false;
                    break;
            }
            Pbullets.push(curBullet);
            break;
    }

    requestAnimationFrame(render);
}

function deleteEBulletsOutOfBound() {

    var toSave = [];
    for (i = 0; i < Ebullets.length; i++) {
        if(Ebullets[i].x<=-4 || Ebullets[i].x>=4 || Ebullets[i].y<=-4 || Ebullets[i].y>=4 )
            continue;
        toSave.push(Ebullets[i]);
    }

    Ebullets = toSave;

}

function isAlive() {
    for (i = 0; i < wall.length; i++) {
        if ((Math.abs(player[0].x - wall[i].x) < 0.001) && (Math.abs(player[0].y - wall[i].y)) < 0.001 && (Math.abs(player[0].z - wall[i].z)) < 0.001)
            return false;
    }
    for (i = 0; i < enemys.length; i++) {
        if ((Math.abs(player[0].x - enemys[i].x) < 0.001) && (Math.abs(player[0].y - enemys[i].y)) < 0.001 && (Math.abs(player[0].z - enemys[i].z)) < 0.001)
            return false;
    }
    for (i = 0; i < Ebullets.length; i++) {
        if((Math.abs(player[0].x - Ebullets[i].x) < 0.001) && (Math.abs(player[0].y - Ebullets[i].y)) < 0.001 && (Math.abs(player[0].z - Ebullets[i].z)) < 0.001)
            return false;
    }
    return true;
}

function bulletMove(b) {

    for (i = 0; i < b.length; i++) {        
        if(b[i].dirPositive && b[i].dirX)
            b[i].x += unit;
        else if(!b[i].dirPositive && b[i].dirX)
            b[i].x -= unit;
        else if(b[i].dirPositive && !b[i].dirX)
            b[i].y += unit;
        else
            b[i].y -= unit;
    }

}

function initializePosition() {
    player = [];
    enemys = [];
    createPlayer();
    createEnemy();
}
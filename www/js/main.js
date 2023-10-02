"use strict";
const container = document.getElementById('container');
const card = document.getElementById('card');
const cardItem = document.getElementById('card-item');
const shine = document.getElementById('shine');
const unshine = document.getElementById('unshine');
function getElementCoord(elem) {
    let box = elem.getBoundingClientRect();
    return {
        top: box.top + window.pageYOffset,
        right: box.right + window.pageXOffset,
        bottom: box.bottom + window.pageYOffset,
        left: box.left + window.pageXOffset,
        centerX: box.left + window.pageXOffset + (box.right - box.left) / 2,
        centerY: box.top + window.pageYOffset + (box.bottom - box.top) / 2,
        width: box.right - box.left,
        height: box.top - box.bottom,
    };
}
var containerRect = getElementCoord(container);
const cursorSimHeight = 190; // Higher means less rotation
const shadowDistance = 5;
const lightPower = 1.5;
const lightDirection = (new Vec3(.15, -1, .25)).normalize();
function rotatePitchRoll(vec, pitch, roll) {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    return new Vec3(vec.x * cp + vec.z * sp, vec.x * sp * sr + vec.y * cr - vec.z * sr * cp, -vec.x * sp * cr + vec.y * sr + vec.z * cp * cr);
}
const shadowXFactor = lightDirection.dot(new Vec3(-1, 0, 0));
const shadowYFactor = lightDirection.dot(new Vec3(0, -1, 0));
const shadowOffset = { x: shadowDistance * shadowXFactor, y: shadowDistance * shadowYFactor };
cardItem.style.filter = `drop-shadow(${shadowOffset.x}px ${shadowOffset.y}px 5px black)`;
const unLightDirection = new Vec3(-lightDirection.x, -lightDirection.y, lightDirection.z);
const backward = new Vec3(0, 0, 1);
function setOrientation(position) {
    const atanX = Math.atan2(Math.abs(position.x), cursorSimHeight);
    const angleX = position.x === 0 ? 0 : position.x > 0 ? atanX : -atanX;
    const atanY = Math.atan2(Math.abs(position.y), cursorSimHeight);
    const angleY = position.y === 0 ? 0 : position.y > 0 ? -atanY : atanY;
    const sinX = Math.sin(angleX);
    const cosX = Math.cos(angleX);
    const sinY = Math.sin(angleY);
    const cosY = Math.cos(angleY);
    // Rotating a vector up toward the viewer to the inclination of the card.
    const normal = rotatePitchRoll(backward, angleX, angleY);
    const li = Math.pow(normal.dot(lightDirection), lightPower);
    cardItem.style.transform = `translateZ(-100px) rotateY(${angleX}rad) rotateX(${angleY}rad)`;
    shine.style.opacity = `${li * 100}%`;
    const unLi = Math.pow(normal.dot(unLightDirection), lightPower);
    unshine.style.opacity = `${unLi * 100}%`;
}
container.isDragging = false;
function startMove() {
    card.style.transform = 'scale(2)';
    if (cardItem.classList.contains('transition-transform')) {
        cardItem.classList.remove('transition-transform');
    }
    container.isDragging = true;
}
function endMove() {
    if (container.isDragging) {
        card.style.transform = '';
        if (!cardItem.classList.contains('transition-transform')) {
            cardItem.classList.add('transition-transform');
        }
        setOrientation({ x: 0, y: 0 });
        container.isDragging = false;
    }
}
container.addEventListener('mousedown', (ev) => {
    startMove();
});
container.addEventListener('mouseup', (ev) => {
    endMove();
});
container.addEventListener('pointerleave', (ev) => {
    endMove();
});
container.addEventListener('mousemove', (ev) => {
    if (container.isDragging) {
        const target = ev.target;
        const targetRect = getElementCoord(target);
        const evPosition = { x: ev.clientX - targetRect.centerX, y: ev.clientY - targetRect.centerY };
        setOrientation(evPosition);
    }
});
container.addEventListener("touchstart", (ev) => {
    startMove();
}, false);
container.addEventListener("touchcancel", (ev) => {
    endMove();
}, false);
container.addEventListener("touchend", (ev) => {
    endMove();
}, false);
container.addEventListener('touchmove', (ev) => {
    ev.preventDefault();
    if (container.isDragging) {
        const target = ev.target;
        const targetRect = getElementCoord(target);
        const evPosition = { x: ev.touches[0].clientX - targetRect.centerX, y: ev.touches[0].clientY - targetRect.centerY };
        setOrientation(evPosition);
    }
});
setOrientation({ x: 0, y: 0 });

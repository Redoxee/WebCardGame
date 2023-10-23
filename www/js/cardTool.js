import { Vec3 } from './vec';
import { addCustomStyle, BoundingRect } from './domUtils';
import { CardLerpAnimation, CardFlipAnimation } from './cardAnimation';
function rotatePitchRoll(vec, pitch, roll) {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    return new Vec3(vec.x * cp + vec.z * sp, vec.x * sp * sr + vec.y * cr - vec.z * sr * cp, -vec.x * sp * cr + vec.y * sr + vec.z * cp * cr);
}
function addCardPresentationCapability(root, options) {
    const card = root;
    card.root = root;
    card.frontItems = Array.from(card.getElementsByClassName('front')).map(e => e);
    card.backItems = Array.from(card.getElementsByClassName('back')).map(e => e);
    card.shadeItems = Array.from(card.getElementsByClassName('shade')).map(e => e);
    card.shineItems = Array.from(card.getElementsByClassName('shine')).map(e => e);
    {
        const cardItemCollection = Array.from(card.getElementsByClassName('card-item')).map(e => e);
        if (cardItemCollection.length !== 1) {
            throw 'wrong number of element with class "card-item"';
        }
        card.cardItem = cardItemCollection.pop();
    }
    {
        const zoomableCollection = Array.from(card.getElementsByClassName('zoom-item')).map(e => e);
        if (zoomableCollection.length !== 1) {
            throw 'wrong number of element with class "zoom-item"';
        }
        card.zoomElement = zoomableCollection.pop();
    }
    card.isFlipped = false;
    const shadowOffset = {
        x: options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Left),
        y: options.shadowDistance * Vec3.dot(options.lightDirection, Vec3.Down)
    };
    card.cardItem.style.filter = `drop-shadow(${shadowOffset.x}px ${shadowOffset.y}px 5px black)`;
    const shadeDirection = new Vec3(-options.lightDirection.x, -options.lightDirection.y, options.lightDirection.z);
    card.SetPosition = (position) => {
        card.lerpAnimator.StopAnimation();
        card.root.style.left = `${position.x}px`;
        card.root.style.top = `${position.y}px`;
        card.currentPosition = position.clone();
    };
    card.LookToward = (position) => {
        const atanX = Math.atan2(Math.abs(position.x), options.simHeight);
        const angleX = position.x === 0 ? 0 : position.x > 0 ? atanX : -atanX;
        const atanY = Math.atan2(Math.abs(position.y), options.simHeight);
        const angleY = position.y === 0 ? 0 : position.y > 0 ? -atanY : atanY;
        card.SetRotation(angleX, angleY);
    };
    card.SetRotation = (ax, ay) => {
        // Rotating a vector up toward the viewer to the inclination of the card.
        const normal = rotatePitchRoll(Vec3.Backward, ax, ay);
        const li = Math.pow(Vec3.dot(normal, options.lightDirection), options.lightPower);
        card.cardItem.style.transform = `rotateY(${ax}rad) rotateX(${ay}rad)`;
        for (let index = 0; index < card.shineItems.length; ++index) {
            card.shineItems[index].style.opacity = `${li * 100}%`;
        }
        const unLi = Math.pow(Vec3.dot(normal, shadeDirection), options.lightPower);
        for (let index = 0; index < card.shadeItems.length; ++index) {
            card.shadeItems[index].style.opacity = `${unLi * 100}%`;
        }
    };
    const smoothTransition = addCustomStyle({
        className: "zoomin",
        content: "transition: transform 0.25s ease-out;"
    });
    card.zoomElement.classList.add(smoothTransition);
    card.SetZoom = (zoom) => {
        card.zoomElement.style.transform = `scale(${zoom})`;
    };
    card.SetSmoothOrientation = (enabled) => {
        if (enabled) {
            if (!card.cardItem.classList.contains(smoothTransition)) {
                card.cardItem.classList.add(smoothTransition);
            }
        }
        else {
            if (card.cardItem.classList.contains(smoothTransition)) {
                card.cardItem.classList.remove(smoothTransition);
            }
        }
    };
    card.SetFlip = (isFlipped) => {
        for (let index = 0; index < card.frontItems.length; ++index) {
            card.frontItems[index].style.display = isFlipped ? 'none' : '';
        }
        for (let index = 0; index < card.backItems.length; ++index) {
            card.backItems[index].style.display = isFlipped ? '' : 'none';
        }
        card.isFlipped = isFlipped;
    };
    card.AnimatedFlip = (isFlipped) => {
        if (card.isFlipped === isFlipped) {
            return;
        }
        card.flipAnimator.StartAnimation(card.isFlipped, 750);
    };
    card.lerpAnimator = new CardLerpAnimation(card, 100);
    card.flipAnimator = new CardFlipAnimation(card);
    const bounds = new BoundingRect(card);
    card.currentPosition = bounds.centerPosition.clone();
    card.SetFlip(false);
    return card;
}
export { addCardPresentationCapability, CardLerpAnimation };

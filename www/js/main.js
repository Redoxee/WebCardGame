import { Vec2, Vec3 } from './vec';
import { addCardPresentationCapability } from './cardTool';
import { uniqueId, BoundingRect } from './domUtils';
import { BezierPreset } from './math';
import { setupCardCollection, SelectClosestItemSelector } from './cardCollectionTool';
function runMain() {
    const board = document.getElementById('game-board');
    const container = document.getElementById('card-root');
    let hoveredCardCollection = null;
    const draggedZindex = 100;
    function makeCard(rootNode) {
        const cardClassName = `PresentationCard${uniqueId()}`;
        rootNode.classList.add(cardClassName);
        const card = document.querySelector(`.${cardClassName} #card`);
        const cardItem = document.querySelector(`.${cardClassName} #card-item`);
        const shine = document.querySelector(`.${cardClassName} #shine`);
        const shade = document.querySelector(`.${cardClassName} #shade`);
        const cardElements = {
            root: rootNode,
            zoomable: card,
            cardItem: cardItem,
            shine: shine,
            shade: shade,
        };
        const cardOptions = {
            lightDirection: (new Vec3(.15, -1, .25)).normalize(),
            simHeight: 190,
            lightPower: 1.5,
            shadowDistance: 5
        };
        const presentationCard = addCardPresentationCapability(cardElements, cardOptions);
        presentationCard.SetOrientation(Vec2.Zero);
        return presentationCard;
    }
    const debugCard = makeCard(container);
    let draggedObject = null;
    function startInput(card) {
        draggedObject = card;
        if (cardCollection.ContainsCard(card)) {
            cardCollection.DetachCard(card);
            cardCollection.ReserveSlot(SelectClosestItemSelector(card.currentPosition.x, card.currentPosition.y));
            hoveredCardCollection = cardCollection;
        }
        card.style.zIndex = draggedZindex.toString();
        debugCard.SetSmoothOrientation(false);
    }
    function endInput() {
        if (draggedObject) {
            draggedObject.style.zIndex = (draggedZindex - 1).toString();
            if (hoveredCardCollection) {
                hoveredCardCollection.AssignCardToReservation(draggedObject);
            }
            draggedObject = null;
        }
    }
    function setupCardInput(targetCard) {
        targetCard.root.addEventListener('mousedown', (_) => {
            startInput(targetCard);
        });
        targetCard.root.addEventListener("touchstart", (ev) => {
            const target = ev.target;
            startInput(target);
        }, false);
        targetCard.root.addEventListener("touchcancel", (ev) => {
            endInput();
        }, false);
        targetCard.root.addEventListener("touchend", (ev) => {
            endInput();
        }, false);
    }
    setupCardInput(debugCard);
    const testButton = document.getElementById('test-button');
    const targets = [
        document.getElementById('target-1'),
        document.getElementById('target-2'),
        document.getElementById('target-3'),
        document.getElementById('target-4'),
    ];
    let currentIndex = 0;
    testButton.addEventListener('click', (_ev) => {
        currentIndex = (currentIndex + 1) % targets.length;
        const targetPosition = new BoundingRect(targets[currentIndex]);
        debugCard.lerpAnimator.startAnimation(debugCard.currentPosition, targetPosition.centerPosition, .65, BezierPreset.EaseInOut);
    });
    function boardMove(card, posX, posY) {
        const startPosition = new BoundingRect(card.root);
        const start = startPosition.centerPosition;
        const end = new Vec2(posX, posY);
        const travelLength = Vec2.sub(end, start).length();
        const lerpLowerBound = 45;
        const lerpUpperBound = 180;
        const minSpeed = .8;
        const maxSpeed = 2.7;
        // Computing the distance versus the lower upper bound (if distance is low keep the low speed, speedup as distance is high)
        let lp = (travelLength - lerpLowerBound) / (lerpUpperBound - lerpLowerBound);
        // clamping between 0 and 1
        if (lp < 0) {
            lp = 0;
        }
        else if (lp > 1) {
            lp = 1;
        }
        // Applying a ramp
        lp = lp * lp;
        // converting to speed
        const lerpedSpeed = (maxSpeed - minSpeed) * lp + minSpeed;
        card.lerpAnimator.startAnimation(start, end, lerpedSpeed, BezierPreset.Linear);
    }
    board.addEventListener('mousemove', (event) => {
        if (draggedObject) {
            boardMove(draggedObject, event.clientX, event.clientY);
        }
    });
    board.addEventListener('touchmove', (event) => {
        if (draggedObject) {
            const target = event.targetTouches[0];
            boardMove(draggedObject, target.clientX, target.clientY - 150);
        }
    });
    board.addEventListener('mouseup', () => {
        endInput();
    });
    const testCards = [];
    for (let index = 0; index < 10; ++index) {
        const element = debugCard.cloneNode(true);
        board.appendChild(element);
        const testCard = makeCard(element);
        testCard.lerpAnimator.startAnimation(testCard.currentPosition, Vec2.add(testCard.currentPosition, new Vec2(index * 30, 0)), .5, BezierPreset.EaseInOut);
        setupCardInput(testCard);
        testCards.push(testCard);
    }
    const cardCollectionElement = document.getElementById('mock-collection');
    const cardCollectionParams = {
        itemStyle: "width : 5em; height: 5em",
    };
    const cardCollection = setupCardCollection(cardCollectionElement, cardCollectionParams);
    board.addEventListener('mousemove', (ev) => {
        const mousePosition = new Vec2(ev.clientX, ev.clientY);
        if (cardCollection.bounds.Contains(mousePosition)) {
            if (!cardCollection.reservingItem) {
                hoveredCardCollection = cardCollection;
            }
            if (draggedObject) {
                cardCollection.ReserveSlot(SelectClosestItemSelector(ev.clientX, ev.clientY));
            }
        }
        else {
            if (hoveredCardCollection && hoveredCardCollection.reservingItem) {
                hoveredCardCollection.CancelReservation();
            }
            hoveredCardCollection = null;
        }
    });
    testCards.forEach((el) => {
        cardCollection.PushCardInstant(el);
    });
}
window.addEventListener('load', () => {
    runMain();
});

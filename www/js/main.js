import { Vec2, Vec3 } from './vec';
import { addCardPresentationCapability } from './cardTool';
import { uniqueId, BoundingRect } from './domUtils';
import { BezierPreset } from './math';
import { setupCardCollection, SelectClosestItemSelector } from './cardCollectionTool';
function runMain() {
    var _a;
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
        if (hoveredCardCollection && hoveredCardCollection.ContainsCard(card)) {
            hoveredCardCollection.DetachCard(card);
            hoveredCardCollection.ReserveSlot(SelectClosestItemSelector(card.currentPosition.x, card.currentPosition.y));
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
    function DetachCardFromAnyCollection(card) {
        allCardCollections.forEach(collection => {
            if (collection.ContainsCard(card)) {
                collection.DetachCard(card);
            }
        });
    }
    const testButton = document.getElementById('slide-button');
    const targets = document.getElementById('slide-test').getElementsByClassName('target');
    let currentIndex = 0;
    testButton.addEventListener('click', (_ev) => {
        currentIndex = (currentIndex + 1) % targets.length;
        const targetPosition = new BoundingRect(targets.item(currentIndex));
        DetachCardFromAnyCollection(debugCard);
        debugCard.lerpAnimator.StartAnimation(debugCard.currentPosition, targetPosition.centerPosition, .65, BezierPreset.EaseInOut);
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
        card.lerpAnimator.StartAnimation(start, end, lerpedSpeed, BezierPreset.Linear);
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
        testCard.lerpAnimator.StartAnimation(testCard.currentPosition, Vec2.add(testCard.currentPosition, new Vec2(index * 30, 0)), .5, BezierPreset.EaseInOut);
        setupCardInput(testCard);
        testCards.push(testCard);
    }
    const cardCollectionParams = {
        itemStyle: "width : 5em; height: 5em",
    };
    const allCardCollections = [];
    const allCardCollectionElements = document.getElementsByClassName('card-collection');
    for (let index = 0; index < allCardCollectionElements.length; ++index) {
        const element = allCardCollectionElements.item(index);
        allCardCollections.push(setupCardCollection(element, cardCollectionParams));
    }
    board.addEventListener('mousemove', (ev) => {
        const mousePosition = new Vec2(ev.clientX, ev.clientY);
        let currentHoveredCollection = null;
        for (let index = 0; index < allCardCollections.length; ++index) {
            const collection = allCardCollections[index];
            if (collection.bounds.Contains(mousePosition)) {
                currentHoveredCollection = collection;
                break;
            }
        }
        if (currentHoveredCollection !== hoveredCardCollection) {
            if (hoveredCardCollection && hoveredCardCollection.reservingItem) {
                hoveredCardCollection.CancelReservation();
            }
            hoveredCardCollection = currentHoveredCollection;
        }
        if (currentHoveredCollection && draggedObject) {
            currentHoveredCollection.ReserveSlot(SelectClosestItemSelector(ev.clientX, ev.clientY));
        }
    });
    {
        const cardCollectionElement = document.getElementById('mock-collection');
        const cardCollection = cardCollectionElement;
        testCards.forEach((el) => {
            cardCollection.PushCardInstant(el);
        });
    }
    {
        const flipCollection = document.getElementById('flip-collection');
        (_a = document.getElementById('flip-button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', ev => {
            flipCollection.itemInUse.forEach(item => {
                if (item.assignedCard) {
                    item.assignedCard.Flip();
                }
            });
        });
    }
}
window.addEventListener('load', () => {
    runMain();
});

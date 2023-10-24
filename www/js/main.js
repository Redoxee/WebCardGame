import { Vec2, Vec3 } from './vec';
import { addCardPresentationCapability } from './cardTool';
import { uniqueId, BoundingRect } from './domUtils';
import { BezierPreset } from './math';
import { setupCardCollection, SelectClosestItemSelector, ReservationResult } from './cardCollectionTool';
function runMain() {
    var _a, _b, _c;
    const board = document.getElementById('game-board');
    const container = document.getElementById('card-root');
    let hoveredCardCollection = null;
    const sfxFlip = Array.from(document.getElementsByClassName('flip-sfx')).map(e => e);
    const draggedZindex = 100;
    function makeCard(rootNode) {
        const cardClassName = `PresentationCard${uniqueId()}`;
        rootNode.classList.add(cardClassName);
        const cardOptions = {
            lightDirection: (new Vec3(.15, -1, .25)).normalize(),
            simHeight: 190,
            lightPower: 1.5,
            shadowDistance: 5
        };
        const presentationCard = addCardPresentationCapability(rootNode, cardOptions);
        presentationCard.LookToward(Vec2.Zero);
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
    function playRandomFlipSfx() {
        const index = Math.floor(Math.random() * sfxFlip.length);
        sfxFlip[index].play();
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
                playRandomFlipSfx();
            }
            hoveredCardCollection = currentHoveredCollection;
        }
        if (currentHoveredCollection && draggedObject) {
            const reservationResult = currentHoveredCollection.ReserveSlot(SelectClosestItemSelector(ev.clientX, ev.clientY));
            if (reservationResult === ReservationResult.New) {
                playRandomFlipSfx();
            }
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
                    item.assignedCard.AnimatedFlip(!item.assignedCard.isFlipped);
                    playRandomFlipSfx();
                }
            });
        });
    }
    {
        const zoomCollection = document.getElementById('zoom-collection');
        let zoomedCard = [];
        (_b = document.getElementById('zoom-button')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', ev => {
            zoomCollection.itemInUse.forEach(item => {
                if (item.assignedCard) {
                    item.assignedCard.SetZoom(2);
                    zoomedCard.push(item.assignedCard);
                }
            });
        });
        zoomCollection.addEventListener('card-detach', (ev) => {
            ev.detail.card.SetZoom(1);
            zoomedCard.splice(zoomedCard.findIndex(e => e.id === ev.detail.card.id), 1);
        });
        board.addEventListener('mousemove', ev => {
            if (!zoomedCard) {
                return;
            }
            zoomedCard.forEach(card => {
                const delatDirection = Vec2.sub(new Vec2(ev.clientX, ev.clientY), card.currentPosition).scale(.5);
                card.LookToward(delatDirection);
            });
        });
    }
    {
        const shuffleCollectionElement = document.getElementById('shuffle-collection');
        const shuffleCollection = setupCardCollection(shuffleCollectionElement, {});
        allCardCollections.push(shuffleCollection);
        (_c = document.getElementById('shuffle-button')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', _ => {
            shuffleCollection.itemInUse.forEach((it, index) => { var _a; return (_a = it.assignedCard) === null || _a === void 0 ? void 0 : _a.circlingAnimation.StartAnimation((index / shuffleCollection.itemInUse.length) * 300); });
        });
    }
}
window.addEventListener('load', () => {
    runMain();
});

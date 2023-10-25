import { Vec2, Vec3 } from './vec';
import { addCardPresentationCapability } from './cardTool';
import { uniqueId, BoundingRect } from './domUtils';
import { BezierPreset } from './math';
import { setupCardCollection, SelectClosestItemSelector, ReservationResult, setupDeckCollection } from './cardCollectionTool';
function runMain() {
    const draggedZindex = 100;
    const displayedCardItemParams = {
        itemStyle: "width : 5em; height: 5em",
    };
    let hoveredCardCollection = null;
    const allCardCollections = [];
    const board = document.getElementById('game-board');
    const mockCard = document.getElementById('mock-card');
    mockCard.parentNode.removeChild(mockCard);
    const sfxFlip = Array.from(document.getElementsByClassName('flip-sfx')).map(e => e);
    const shopDeck = setupDeckCollection(document.getElementById('shop-deck'), {});
    const shopBoard = setupCardCollection(document.getElementById('shop'), {});
    const playedCards = setupCardCollection(document.getElementById('played-cards'), displayedCardItemParams);
    const playerDeck = setupDeckCollection(document.getElementById('player-deck'), {});
    const playerHand = setupCardCollection(document.getElementById('player-hand'), displayedCardItemParams);
    const playerDiscard = setupDeckCollection(document.getElementById('player-discard'), {});
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
    let draggedObject = null;
    function startInput(card) {
        draggedObject = card;
        if (hoveredCardCollection && hoveredCardCollection.ContainsCard(card)) {
            hoveredCardCollection.DetachCard(card);
            hoveredCardCollection.ReserveSlot(SelectClosestItemSelector(card.currentPosition.x, card.currentPosition.y));
        }
        card.style.zIndex = draggedZindex.toString();
        card.SetSmoothOrientation(false);
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
            console.log('hello');
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
    for (let index = 0; index < 15; ++index) {
        const shopCard = makeCard(mockCard.cloneNode(true));
        board.appendChild(shopCard);
        shopCard.SetFlip(true);
    }
}
window.addEventListener('load', () => {
    runMain();
});

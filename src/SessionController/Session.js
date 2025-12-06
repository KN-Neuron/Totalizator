export class Session {
    constructor (walletStatus =  5000, baseMultiplier = 2.25) {
        this.numTracks = 4;
        this.walletStatus = walletStatus;
        this.baseMultiplier = baseMultiplier;
        this.currentUserBets = this.#getStartBets();
        this.trackMultipliers = this.#getStartMultipliers();
        this.prevWinTrack = null;
        this.gameOn = false;
    }

    #getStartBets() {
        return [0, 0, 0, 0];
    }

    #getStartMultipliers() {
        const multipliers = [];
        for (let i = 0; i < this.numTracks; i++) {
            multipliers[i] = this.baseMultiplier;
        }
        return multipliers;
    }

    placeBet(track, amount) {
        if (this.gameOn) {
            throw new EvalError('Zakłady są zamknięte w trakcie gry');
        }
        if (this.walletStatus - amount < 0) {
            throw new EvalError('Brak środków na dany zakład');
        } else {
            this.currentUserBets[track] += amount;
            this.walletStatus -= amount;
        }
    }

    startRound() {
        if (this.gameOn) {
            throw new EvalError('Gra już trwa');
        }
        this.gameOn = true;
    }

    finishRound(winningTrack) {
        this.gameOn = false;
        this.prevWinTrack = winningTrack;
        this.walletStatus += this.getPredictedWinnings(winningTrack);
        this.currentUserBets = this.#getStartBets();
        this.trackMultipliers = this.#getStartMultipliers();
    }

    getPredictedWinnings(track) {
        return this.currentUserBets[track] * this.trackMultipliers[track];
    }

    updateMultiplier(track, newMultiplier) {
        this.trackMultipliers[track] = newMultiplier;
    }
}
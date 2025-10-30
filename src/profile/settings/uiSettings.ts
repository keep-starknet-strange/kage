export default class UiSettings {
    readonly isBalanceHidden: boolean;

    constructor(
        isBalanceHidden: boolean
    ) {
        this.isBalanceHidden = isBalanceHidden;
    }

    toggleBalanceVisibility(): UiSettings {
        return new UiSettings(!this.isBalanceHidden);
    }

    static default(): UiSettings {
        return new UiSettings(false);
    }
}
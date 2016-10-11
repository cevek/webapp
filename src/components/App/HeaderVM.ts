import {observable, computed} from "mobx";
export class HeaderVM {
    @observable title = "";
    @computed get uppercaseTitle() {
        return (this.title || "").toUpperCase();
    }
}
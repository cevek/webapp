import {observable} from "mobx";
export class IssuesVM {
    @observable activeTab = "Opened";
}

export const issuesVM = new IssuesVM();
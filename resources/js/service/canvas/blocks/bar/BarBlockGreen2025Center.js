import {Alignments} from "../../Constants";
import BarBlockGreen from "./BarBlockGreen";

export default class BarBlockGreen2025Center extends BarBlockGreen {
    constructor(bars) {
        super(bars)
        this._alignment = Alignments.center
    }

    set alignment(alignment) {
    }
}

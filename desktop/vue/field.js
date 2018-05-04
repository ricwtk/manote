let _props = () => ["value", "title", "removable", "editable", "displayValue", "height"];

// ---------- input-header ----------
const _input_header = {
  props: ["title", "removable", "label-for"],
  methods: {
    remove: function (ev) {
      this.$emit("remove");
    }
  },
  template: `
    <label class="input-header divider" :for="labelFor" data-content="">
      <div class="content text-gray">
        <div>{{ title }}</div>
        <div class="mdi mdi-close" v-if="removable" @click.prevent="remove"></div>
      </div>
    </label>
  `
}

// ---------- single ----------

let _single = {
  props: ["value", "title", "removable", "editable", "displayValue", "height"],//_props(),
  components: {
    "input-header": _input_header
  },
  methods: {
    removeField: function () {
      this.$emit("remove");
    },
    updateValue: function (ev) {
      this.$emit("input", ev.target.value)
    } 
  },
  template: `
  <div>
    <input-header 
      :label-for="'value-' + title" 
      :title="title" 
      :removable="removable && editable"
      @remove="removeField"
    ></input-header>
    
    <input v-if="editable"
      class="form-input" 
      :id="'value-' + title" 
      :placeholder="title"
      :value="value"
      @input="updateValue">

    <div v-else
      class="display-input md-default" 
      :id="'value-' + title"
      v-html="displayValue"></div>
  </div>
  `
}

// ---------- multiple ----------

let _multiple = {
  props: _props(),
  components: {
    "input-header": _input_header
  },
  methods: {
    removeField: function () {
      this.$emit("remove");
    },
    updateValue: function (ev) {
      this.$emit("input", ev.target.value)
    },
    resize: function (ev) {
      this.$emit("resize", window.getComputedStyle(ev.target).height);
    }
  },
  template: `
  <div>
    <input-header 
      :label-for="'value-' + title" 
      :title="title" 
      :removable="removable && editable"
      @remove="removeField"
    ></input-header>

    <template v-if="editable">
      <textarea class="form-input"
        :id="'value-' + title" 
        :placeholder="title" 
        :style="{ height: height ? height : 'auto' }"
        @mouseup="resize"
        :value="value"
        @input="updateValue"
      ></textarea>
      <div class="text-right">
        <button class="btn btn-primary btn-sm" @click="height='auto'">
          <i class="mdi mdi-arrow-expand-vertical"></i>
          Reset height
        </button>
      </div>
    </template>

    <div v-else
      class="display-input md-default" 
      :id="'value-' + title"
      v-html="displayValue"></div>
  </div>
  `
};

// ---------- datetime ----------

let _datetime = {
  props: _props(),
  components: {
    "input-header": _input_header
  },
  data: function () {
    return {
      removedDate: "",
      removedTime: "",
      limits: {
        year: [1970, 2100],
        month: [1, 12],
        day: [1, 31],
        hour: [0, 23],
        minute: [0, 59]
      },
      ndig: {
        year: 4,
        month: 2,
        day: 2,
        hour: 2,
        minute: 2
      }
    }
  },
  computed: {
    dateDisabled: function () {
      return this.value.substr(0,10) == "-".repeat(10);
    },
    timeDisabled: function () {
      return this.value.substr(-5) == "-".repeat(5);
    }
  },
  methods: {
    removeField: function () {
      this.$emit("remove");
    },
    getCurrentDate: function () {
      return this.$refs.year.value + "-" + this.$refs.month.value + "-" + this.$refs.day.value;
    },
    getCurrentTime: function () {
      return this.$refs.hour.value + ":" + this.$refs.minute.value;
    },
    selectThis: function (ev) {
      ev.target.selectionStart = 0;
      ev.target.selectionEnd = -1;
    },
    toggleDate: function () {
      if (this.dateDisabled) {
        if (this.removedDate !== "") {
          this.$emit("input", this.removedDate + "T" + this.getCurrentTime());
        } else {
          this.$emit("input", new Date().toISOString().substr(0,10) + "T" + this.getCurrentTime());
        }
      } else {
        this.removedDate = this.value.substr(0,10);
        this.$emit("input", "-".repeat(10) + "T" + this.getCurrentTime());
      }
    },
    toggleTime: function () {
      if (this.timeDisabled) {
        if (this.removedTime !== "") {
          this.$emit("input", this.getCurrentDate() + "T" + this.removedTime);
        } else {
          this.$emit("input", this.getCurrentDate() + "T" + new Date().toISOString().substr(11,5));
        }
      } else {
        this.removedTime = this.value.substr(-5);
        this.$emit("input", this.getCurrentDate() + "T" + "-".repeat(5));
      }
    },
    limitValue: function (val, sect) {
      val = val < this.limits[sect][0] ? this.limits[sect][0] : val;
      val = val > this.limits[sect][1] ? this.limits[sect][1] : val;
      return val.toString().padStart(2, "0");
    },
    updateLimits: function (changedSect) {
      if (changedSect == "year" || changedSect == "month") {
        let year = parseInt(this.$refs.year.value);
        let month = parseInt(this.$refs.month.value);
        this.limits.day[1] = new Date(year, month, 0).getDate();
        this.$refs.day.value = this.limitValue(this.$refs.day.value, "day");
      }
    }, 
    updateValue: function (ev, sect) {
      let newVal, newLoc;
      if (ev.keyCode > 47 && ev.keyCode < 58) { // 0-9
        let loc = ev.target.selectionStart;
        let val = ev.target.value.split("");
        if (loc >= this.ndig[sect]) {
          loc = 0;
        }
        val.splice(loc, 1, ev.key);
        newLoc = loc + 1;
        newVal = val.join("");
      }
      if (ev.keyCode == 38) // up
        newVal = parseInt(ev.target.value) + 1;
      if (ev.keyCode == 40) // down
        newVal = parseInt(ev.target.value) - 1;

      if (newVal) {
        ev.target.value = this.limitValue(newVal, sect);
        this.updateLimits(sect);
      }
      if (newLoc) {
        ev.target.selectionStart = newLoc;
        ev.target.selectionEnd = newLoc;
      }
      if (![9,18,35,36,37,39].includes(ev.keyCode) && !(ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey)) { // tab, alt, end, home, left, right
        ev.preventDefault();
      }
      this.$emit("input", this.$refs.year.value + "-" + this.$refs.month.value + "-" + this.$refs.day.value + "T" + this.$refs.hour.value + ":" + this.$refs.minute.value);
    }
  },
  template: `
  <div>
    <input-header 
      :label-for="'value-' + title" 
      :title="title" 
      :removable="removable && editable"
      @remove="removeField"
    ></input-header>

    <div v-if="editable" class="input-datetime form-input">
      <div class="input-group col-6 col-md-12">
        <div :class="['mdi', 'mdi-calendar', dateDisabled ? 'text-error' : 'text-success']" @click="toggleDate"></div>
        <input type="text" ref="year" :disabled="dateDisabled" class="invisible-form-input text-center four-digits" :value="value.substr(0,4)" @keydown="updateValue($event,'year')" @click="selectThis">
        <div>-</div>
        <input type="text" ref="month" :disabled="dateDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(5,2)" @keydown="updateValue($event,'month')" @click="selectThis">
        <div>-</div>
        <input type="text" ref="day" :disabled="dateDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(8,2)" @keydown="updateValue($event,'day')" @click="selectThis">
      </div>
      <div class="input-group col-6 col-md-12">
        <div :class="['mdi', 'mdi-clock', timeDisabled ? 'text-error' : 'text-success']" @click="toggleTime"></div>
        <input type="text" ref="hour" :disabled="timeDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(-5,2)" @keydown="updateValue($event,'hour')" @click="selectThis">
        <div>:</div>
        <input type="text" ref="minute" :disabled="timeDisabled" class="invisible-form-input text-center two-digits" :value="value.substr(-2)" @keydown="updateValue($event,'minute')" @click="selectThis">
      </div>
    </div>

    <div v-else class="input-datetime">
      <div class="input-group col-6 col-md-12">
        <div :class="['mdi', 'mdi-calendar', dateDisabled ? 'text-error' : 'text-success']"></div>
        <div class="text-center four-digits">{{ displayValue.substr(0,4) }}</div>
        <div>-</div>
        <div class="text-center two-digits">{{ displayValue.substr(5,2) }}</div>
        <div>-</div>
        <div class="text-center two-digits">{{ displayValue.substr(8,2) }}</div>
      </div>
      <div class="input-group col-6 col-md-12">
        <div :class="['mdi', 'mdi-clock', timeDisabled ? 'text-error' : 'text-success']"></div>
        <div class="text-center two-digits">{{ displayValue.substr(-5,2) }}</div>
        <div>:</div>
        <div class="text-center two-digits">{{ displayValue.substr(-2) }}</div>
      </div>
    </div>
  </div>
  `
};

// ---------- tags ----------

let _tags = {
  props: _props(),
  components: {
    "input-header": _input_header
  },
  methods: {
    removeField: function () {
      this.$emit("remove");
    },
    updateValue: function (value) {
      this.$emit("input", value)
    },
    updateTags: function(ev) {
      if (ev.keyCode == 188 || ev.keyCode == 13) {
        ev.preventDefault();
        if (ev.target.value != "") {
          if (!this.value.includes(ev.target.value)) {
            this.updateValue([...this.value, ev.target.value]);
          }
          ev.target.value = "";
        }
      }
    },
    removeTag: function(tag) {
      let value = Array.from(this.value);
      value.splice(value.findIndex(el => el == tag), 1);
      this.updateValue(value);
    },
  },
  template: `
  <div>
    <input-header 
      :label-for="'value-' + title" 
      :title="title" 
      :removable="removable && editable"
      @remove="removeField"
    ></input-header>

    <div v-if="editable">
      <input class="form-input" type="text" :id="'value-' + title" :placeholder="title" @keydown="updateTags">
      <div class="my-2"></div>
      <span class="chip" v-for="tag in value">
        {{ tag }}&nbsp;
        <span class="mdi mdi-close" @click="removeTag(tag)"></span>
      </span>
    </div>
      
    <div v-else class="display-input">
      <span class="chip" v-for="tag in displayValue">
        {{ tag }}
      </span>
    </div>
  </div>
  `
};




module.exports = {
  "single": _single,
  "multiple": _multiple,
  "datetime": _datetime,
  "tags": _tags
};
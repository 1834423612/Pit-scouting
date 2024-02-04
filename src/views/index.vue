<!-- //to-do: serverside event input, team# as select, pre-fill from same bot number from last comp during this season,required attribute
based on robot from last competition if form same season -->
<template>
  <div class="app">
    <div class="form-container">
      <el-form :model="formData" ref="form" label-width="120px" label-position="top">
        <h3>Form</h3>

        <el-divider border-style="dashed" />
        <div class="form-header">
          <el-button type="primary" @click="clearForm" class="shadow">Clear Form</el-button>

          <div class="saving-status">
            <el-icon v-if="!formModified" color="#337ecc" :size="20">
              <checked />
            </el-icon>
            <el-icon v-else-if="savingStatus === 'saving'" class="is-loading">
              <loading />
            </el-icon>
            <el-icon v-else-if="savingStatus === 'success'" color="#67C23A" :size="20">
              <check />
            </el-icon>
            <span v-if="formModified" style="color: #909399">{{
              savingStatusText
            }}</span>
            <span v-else style="color: #529b2e">This form support auto-save</span>
          </div>
        </div>
        <br />

        <div class="question-continer">
          <el-form-item v-for="(x, index) in form" :key="x.question" :label="x.question"
            :prop="Object.keys(formData)[index]" :rules="[
              {
                required: x.required,
                message: 'This field is required',
                trigger: ['blur', 'change'],
              },
            ]">
            <el-collapse class="collapse" v-if="typeof x.i === 'string'" v-model="activeName" accordion>
              <el-collapse-item title="Image Drop-down" name="1">
                <div>
                  <img :src="x.i" alt="Error" :width="x.w" />
                </div>
              </el-collapse-item>
            </el-collapse>

            <el-input v-if="x.type === 'hidden'" type="hidden"
              v-model="formData[Object.keys(formData)[index]]"></el-input>
            <el-input v-else-if="x.type === 'text'" v-model="formData[Object.keys(formData)[index]]"></el-input>
            <el-input v-else-if="x.type === 'number'" v-model="formData[Object.keys(formData)[index]]"
              pattern="^\d+(\s\d+\/\d+)?(\.\d+)?$|^\d+\/\d+$" title="Valid forms: _ , _._ , n/d , _ n/d"
              style="width: 150px"></el-input>
            <el-input v-else-if="x.type === 'integer'" v-model="formData[Object.keys(formData)[index]]" pattern="^\d+$"
              style="width: 100px">
            </el-input>
            <el-autocomplete v-else-if="x.type === 'autocomplete'" v-model="formData[Object.keys(formData)[index]]"
              style="width: 150px" :fetch-suggestions="querySearch" :trigger-on-focus="false" clearable
              placeholder="Team #" @select="handleSelect" />
            <el-radio-group v-else-if="x.type === 'radio'" v-model="formData[Object.keys(formData)[index]]"
              class="vertical-layout" @change="handleRadioChange(x, $event)">
              <el-radio v-for="option in x.options" :key="option" :label="option">{{ option }}</el-radio>

              <el-radio label="other" :value="x.otherValue"></el-radio>

              <el-input v-if="x.showOtherInput" v-model="formData[Object.keys(formData)[index]]" :rows="3" type="textarea"
                placeholder="Please input"></el-input>
            </el-radio-group>

            <el-checkbox-group v-else-if="x.type === 'checkbox'" v-model="formData[Object.keys(formData)[index]]"
              @change="handleCheckboxChange(x, $event)" class="vertical-layout">
              <el-checkbox v-for="option in x.options" :key="option" :label="option">{{ option }}</el-checkbox>
              <el-checkbox label="other"></el-checkbox>
              <el-input v-if="x.showOtherInput" v-model="formData[Object.keys(formData)[index]]" :rows="3"
                placeholder="Please input"></el-input>
            </el-checkbox-group>

            <!--doesn't work:<el-select v-else-if="x.type==='select'" v-model="x.value" required>
            <el-option
              v-for="option in x.options"
              :key="option"
              :label="option"
            >{{ option }}
            </el-option>
          </el-select>-->

            <el-input v-else-if="x.type === 'textarea'" type="textarea"
              v-model="formData[Object.keys(formData)[index]]"></el-input>
          </el-form-item>
        </div>
        <el-form-item label="Picture - Full Robot">
          <el-upload class="upload-demo" drag action="http://localhost:3000/upload?type=full_robot"
            :on-success="handleSuccess0" :on-remove="handleRemove" :file-list="fileList.fullRobot" list-type="picture">
            <el-icon :size="50" color="#b3b3b3">
              <upload />
            </el-icon>
            <div class="el-upload__text">
              Drag files here or <em>click to upload</em>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="Picture - Drive Train">
          <el-upload class="upload-demo" drag action="http://localhost:3000/upload?type=drive_train"
            :on-success="handleSuccess1" :on-remove="handleRemove" :file-list="fileList.driveTrain" list-type="picture">
            <el-icon :size="50" color="#b3b3b3">
              <upload />
            </el-icon>
            <div class="el-upload__text">
              Drag files here or <em>click to upload</em>
            </div>
          </el-upload>
        </el-form-item>
        <el-button type="primary" @click="submitForm" class="shadow">Submit</el-button>
      </el-form>
    </div>
  </div>
</template>

<script>
//import axios from "axios";
//import the right stuff below
const _event = "test";
const teams = [695, 2000];
export default {
  data() {
    return {
      teams: teams.map(team => ({ value: team.toString() })),

      savingStatus: "idle", // Possible values: 'idle', 'saving', 'success', 'error' (used for auto-save)
      formModified: false,

      form: [
        {
          question: "",
          type: "hidden",
          required: true,
        },
        {
          question: "Team number",
          type: "autocomplete",
          required: true,
        },
        {
          i: "https://lh7-us.googleusercontent.com/pUWvHrPDa5IfrQcFalk4lO0e4PhD3sLMP0jyLJU8PTWWGfw5r-Wa4qDQNHhbu0byYLzXScP5lfTSUCsvbNI-FlwDY2L7Ra0-TgYqf5Eabw0INSFE3ah4QCqCqHFrsaPKyCOt8m2Yo-H2ie9E7apzh6c8AO147A",
          w: "50%",
          question: "Type of drive train",
          type: "radio",
          options: [
            'Tank Drive ("skid steer", plates on both sides of wheels)',
            "West Coast Drive (wheels mounted off one side of tube)",
            "Swerve Drive",
          ],
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          i: "https://lh7-us.googleusercontent.com/PCI7CaG88MiY50L7AM0CVTs9dRd3NQgqW4B2rd64vmjHaNDMEHR0EkWYqv-rzHBnGBC08NzWtr7W97lIk226Q9WVCPuTKuOSZcpb6eyNC5Q3HGmFQwp8005gRcxiS09RjeWUJQJTK-vQGDWd0QAbpSipLSkExw",
          w: "100%",
          question: "Type of wheels used",
          type: "radio",
          options: [
            "Traction",
            "Mecanum (rollers at 45° angle)",
            "Omni (rollers at 90° angle)",
          ],
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Intake Use:",
          type: "checkbox",
          options: ["Ground", "Station"],
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Scoring Locations:",
          type: "checkbox",
          options: ["Amp", "Speaker", "Trap"],
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Robot Weight",
          type: "number",
          required: true,
        },
        {
          question:
            "Robot Dimension (Length in Inches) without bumpers - front to back",
          type: "number",
          required: true,
        },
        {
          question:
            "Robot Dimension (Width in Inches) without bumpers - left to right",
          type: "number",
          required: true,
        },
        {
          question:
            "Robot Dimension (Height in Inches) from floor to highest point on robot at the start of the match",
          type: "number",
          required: true,
        },
        {
          question: "Drive Team Members",
          type: "radio",
          options: [
            "One person driving and operating the robot during a match",
          ],
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
        },
        {
          question: "Hours/Weeks of Practice",
          type: "text",
          required: true,
        },
        {
          question: "Additional Comments",
          type: "textarea",
          required: false,
        },
      ],
      // fileList : this.form.filter(item => item.type === 'file').map(item => item.value)
      fileList: {
        fullRobot: [],
        driveTrain: [],
      },

      // Required for uploading files ID
      fileIds: {
        fullRobot: [],
        driveTrain: [],
      },

      textarea: "",
      saveTimeout: "",

      // el-form
      formData: {
        event: _event,
        teamNumber: "",
        typeOfDriveTrain: "",
        typeOfWheelsUsed: "",
        intakeUse: [],
        scoringLocations: [],
        robotWeight: "",
        robotDimensionLength: "",
        robotDimensionWidth: "",
        robotDimensionHeight: "",
        driveTeamMembers: "",
        hoursWeeksOfPractice: "",
        additionalComments: "",
      },
    };
  },

  created() {
    this.restoreFormData();
  },

  computed: {
    //fileList() {
    //  return this.form.filter((item) => item.type === "file");
    // },

    savingStatusText() {
      switch (this.savingStatus) {
        case "idle":
          return "";
        case "saving":
          return "Saving...";
        case "success":
          return "All changes saved";
        case "error":
          return "Error saving changes";
        default:
          return "";
      }
    },
  },

  watch: {
    form: {
      handler(newForm) {
        // If the form is modified, set the saving status to 'saving'
        if (!this.formModified) {
          this.formModified = true;
        }
        if (this.saveTimeout) {
          clearTimeout(this.saveTimeout);
        }

        this.savingStatus = "saving";
        newForm.forEach((question,index) => {
          if (question.type === "checkbox") {
            localStorage.setItem(
              question.question,
              JSON.stringify(question.value)
            );
          } else { localStorage.setItem(question.question, question.value); }
          localStorage.setItem(
            question.question + "-otherValue",
            question.otherValue
          );
        });
        this.saveTimeout = setTimeout(this.savingStatus = "success", 2000); // Set the saving status to 'success' after 2s
      },
      deep: true,
    },
  },

  methods: {
    handleRadioChange(question, value) {
      question.showOtherInput = value === "other";
    },
    handleCheckboxChange(question, values) {
      question.showOtherInput = values.includes("other");
    },
    handleSelect: (item) => { },
    querySearch(queryString, cb) {
      const filter = (team) => team.value.indexOf(queryString) === 0;
      const results = queryString ? this.teams.filter(filter) : this.teams;
      cb(results);
    },
    mounted() {
      // Check if the form has been saved before
      this.form.forEach((question) => {
        if (question.type === "radio" && question.value === "other") {
          question.showOtherInput = true;
        }
        if (question.type === "checkbox" && question.value.includes("other")) {
          question.showOtherInput = true;
        }
      });
    },

    restoreFormData() {
      this.form.forEach((question) => {
        try {
          // From normal input type, make sure the value is not null
          const savedValue = localStorage.getItem(question.question);
          if (savedValue && savedValue !== "null") {
            question.value = savedValue;
          }

          // From radio type, make sure the value is 'other'
          const otherValue = localStorage.getItem(
            question.question + "-otherValue"
          );
          if (otherValue && otherValue !== "null") {
            question.otherValue = otherValue;
          }

          // From checkbox type, make sure the value is an array
          if (question.type === "checkbox" && savedValue) {
            question.value = JSON.parse(savedValue);
          }

          // Update the showOtherInput status
          if (
            (question.type === "radio" && question.value === "other") ||
            (question.type === "checkbox" && question.value.includes("other"))
          ) {
            question.showOtherInput = true;
          }
        } catch (error) {
          console.error("Error restoring form data:", error);
        }
      });
    },

    beforeDestroy() {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
    },

    clearForm() {
      this.$confirm("Are you sure you want to clear the form?", "Warning", {
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        type: "warning",
      })
        .then(() => {
          this.resetFormData();
          this.$message({
            type: "success",
            message: "Form has been cleared!",
          });

          // Reset the saving status
          this.formModified = false;
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "Clear canceled",
          });
        });
    },

    resetFormData() {
      this.form.forEach((question) => {
        if (question.type === "checkbox") {
          question.value = [];
        } else {
          question.value = null;
        }
        question.showOtherInput = false;
        question.otherValue = "";
      });
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          let formData = new FormData();
          try {
            const response = await axios.post('http://localhost:3000/submit-form', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            // this.$message.success('Form submitted successfully');
            console.log('Form submitted successfully:', response.data);
          } catch (error) {
            console.error('Error submitting form:', error);
            // this.$message.error('Error submitting form');
          }
        }
      });
    },



    handleSuccess0(response, file) {
      console.log("Upload successful:", response);
      if (response && response.fileId) {
        const fileId = response.fileId;
        file.fileId = fileId; // Add fileId to the file object
        this.fileList.fullRobot.push(file); // Add file object to array
        this.fileIds.fullRobot.push(fileId); // Add  "fullRobot"  fileId to array

        console.log("Updated fileIds:", JSON.stringify(this.fileIds));
      } else {
        console.error("No fileId returned from the server");
      }
    },

    handleSuccess1(response, file) {
      console.log("Upload successful:", response);
      if (response && response.fileId) {
        const fileId = response.fileId;
        file.fileId = fileId; // Add fileId to the file object
        this.fileList.driveTrain.push(file); // Add file object to array
        this.fileIds.driveTrain.push(fileId); // Add  "DriveTrain"  fileId to array

        console.log("Updated fileIds:", JSON.stringify(this.fileIds));
      } else {
        console.error("No fileId returned from the server");
      }
    },

    handleRemove(file, fileList) {
      console.log("File removed:", file);

      const fileId = file.fileId;
      if (!fileId) {
        console.error("File ID is missing, cannot delete the file.");
        return;
      }

      // Get the file list name
      const fileListName =
        fileList === this.fileList.fullRobot ? "fullRobot" : "driveTrain";

      // Update the file list and fileID
      this.fileIds[fileListName] = this.fileIds[fileListName].filter(
        (id) => id !== fileId
      );
      this.fileList[fileListName] = this.fileList[fileListName].filter(
        (f) => f.fileId !== fileId
      );

      // Send delete request to the server
      axios
        .get(`http://localhost:3000/delete?file_ID=${fileId}`)
        .then((response) => {
          console.log("File deletion response:", response.data);
        })
        .catch((error) => {
          console.error("Error deleting the file:", error);
        });
    },
  },
};
</script>

<style scoped>
.form-container {
  margin: 10px 0px;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
    -3px -1px 3px 0 rgba(0, 0, 0, 0.14), 0px 3px 3px 0 rgba(0, 0, 0, 0.12),
    4px 0px 3px 0 rgba(0, 0, 0, 0.12);
  background-color: #c6e2ff;
  width: 100%;
}

.form-header {
  display: flex;
  align-items: flex-end;
  align-content: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.saving-status {
  display: flex;
  align-items: center;
}

.vertical-layout {
  display: inline-flex;
  align-items: flex-start;
  flex-wrap: wrap;
  font-size: 0;
  flex-direction: column;

  margin-left: 2%;
}

.question-continer {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  flex: 1;
  line-height: 32px;
  position: relative;
  font-size: var(--font-size);
  min-width: 0;
  flex-direction: column;
  align-content: flex-start;
  /* align-items: flex-start; */
  /* Auto detect the width of the container */
  width: -webkit-fill-available;
}

.collapse {
  margin-left: 2%;
  width: -webkit-fill-available;
  background-color: #c6e2ff;
}

/* Style for <details> when it is not open */
el-collapse-item {
  width: 100%;
}

el-collapse-item {
  background-color: #8192a4;
}

.shadow {
  background-color: dodgerblue !important;
  box-shadow: 0 6px #3077b9;
  transition: all 0.1s ease-in-out;
}

.shadow:hover {
  background-color: #66b3ff !important;
  box-shadow: 0 6px #76a5e3;
  transition: all 0.1s ease-in-out;
}

.shadow:active {
  background-color: #0066cc !important;
  box-shadow: 0 6px #1f4e7a;
  transition: all 0.1s ease-in-out;
}

/* Auto detect User's screen size */

/* Lower than 960px */
/* Phone size */
@media screen and (max-width: 960px) {
  #app {
    max-width: 350px;
    padding: 0rem;
  }

  .form-container {
    background: #000;
    padding: 10px 20px;
    border-radius: 15px;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2), -3px -1px 3px 0 rgba(0, 0, 0, 0.14), 0px 3px 3px 0 rgba(0, 0, 0, 0.12), 4px 0px 3px 0 rgba(0, 0, 0, 0.12);
    background-color: #c6e2ff;
    /* width: 100%; */
  }
}

/* Higher than 960px */
/* Laptop/PC size */
@media screen and (min-width: 960px) {

  .question-continer {
    max-width: 650px;
  }
}
</style>
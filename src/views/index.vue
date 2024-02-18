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

          <!-- Auto-save status -->
          <div class="saving-status">
            <span v-if="savingStatus === 'idle'" style="color: #529b2e; display: contents;">
              <el-icon color="#337ecc" :size="20">
                <checked />
              </el-icon>
              This form supports auto-save
            </span>

            <span v-else-if="savingStatus === 'saving'" style="color: #909399; display: contents;">
              <el-icon color="#909399" class="is-loading">
                <loading />
              </el-icon>
              Saving...
            </span>

            <span v-else-if="savingStatus === 'success'" style="color: #67C23A; display: contents;">
              <el-icon color="#67C23A" :size="20">
                <check />
              </el-icon>
              Saved successfully
            </span>

            <span v-else-if="savingStatus === 'error'" style="color: #F56C6C; display: contents;">
              <el-icon color="#F56C6C" :size="20">
                <CloseBold />
              </el-icon>
              Error saving changes
            </span>
          </div>
        </div>
        <br />

        <!-- Form questions -->
        <div class="question-continer">
          <el-form-item v-for="x of form" :key="x.question" :label="x.question" :required="x.required" :rules="[
            {
              required: x.required,
              message: 'This field is required',
              trigger: 'blur',
            },
          ]">
            <el-collapse class="collapse" v-if="typeof x.i === 'string'" v-model="activeName" accordion>
              <el-collapse-item title="Image Drop-down" name="1">
                <div>
                  <img :src="x.i" alt="Error" :width="x.w" />
                </div>
              </el-collapse-item>
            </el-collapse>

            <el-input v-if="x.type === 'hidden'" type="hidden" v-model="x.value"></el-input>
            <el-input v-else-if="x.type === 'text'" v-model="x.value"></el-input>
            <el-input v-else-if="x.type === 'number'" v-model="x.value" pattern="^\d+(\s\d+\/\d+)?(\.\d+)?$|^\d+\/\d+$"
              title="Valid forms: _ , _._ , n/d , _ n/d" style="width: 150px"></el-input>
            <el-input v-else-if="x.type === 'integer'" v-model="x.value" pattern="^\d+$" style="width: 100px">
            </el-input>

            <el-autocomplete v-else-if="x.type === 'autocomplete'" v-model="x.value" style="width: 100px"
              :fetch-suggestions="querySearch" :trigger-on-focus="false" clearable placeholder="Team #"
              @select="handleSelect" />
            <el-radio-group v-else-if="x.type === 'radio'" v-model="x.value" class="vertical-layout"
              @change="handleRadioChange(x, $event)">
              <el-radio v-for="option in x.options" :key="option" :label="option">{{ option }}</el-radio>

              <el-radio label="other" :value="x.otherValue"></el-radio>

              <el-input v-if="x.showOtherInput" v-model="x.otherValue" :rows="3" type="textarea"
                placeholder="Please input"></el-input>
            </el-radio-group>

            <el-checkbox-group v-else-if="x.type === 'checkbox'" v-model="x.value"
              @change="handleCheckboxChange(x, $event)" class="vertical-layout">
              <el-checkbox v-for="option in x.options" :key="option" :label="option">{{ option }}</el-checkbox>
              <el-checkbox label="other"></el-checkbox>
              <el-input v-if="x.showOtherInput" v-model="x.otherValue" :rows="3" placeholder="Please input"></el-input>
            </el-checkbox-group>

            <!--doesn't work:<el-select v-else-if="x.type==='select'" v-model="x.value" required>
            <el-option
              v-for="option in x.options"
              :key="option"
              :label="option"
            >{{ option }}
            </el-option>
          </el-select>-->

            <el-input v-else-if="x.type === 'textarea'" type="textarea" v-model="x.value" required></el-input>
          </el-form-item>
          <el-form-item label="Picture - Full Robot">
            <el-upload class="upload-demo" drag action="https://scoutify.makesome.cool/upload?type=full_robot"
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
            <el-upload class="upload-demo" drag action="https://scoutify.makesome.cool/upload?type=drive_train"
              :on-success="handleSuccess1" :on-remove="handleRemove" :file-list="fileList.driveTrain" list-type="picture">
              <el-icon :size="50" color="#b3b3b3">
                <upload />
              </el-icon>
              <div class="el-upload__text">
                Drag files here or <em>click to upload</em>
              </div>
            </el-upload>
          </el-form-item>
        </div>
        <el-button type="primary" @click="submitForm" class="shadow">Submit</el-button>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from 'sweetalert2'

//import the right stuff below
const _event = "test";
const teams = [];


// 转换换行符为 <br> 的示例
// // 假设 additionalComments 是从数据库中取出的字符串
// let additionalComments = "这是一段文本。\n这是新的一行。";

// // 在 HTML 中显示时，将 \n 转换为 <br>
// additionalComments = additionalComments.replace(/\n/g, '<br>');

// // 然后将处理后的字符串设置到相应的元素中
// document.getElementById('comments').innerHTML = additionalComments;




// const teams = apiU;





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
          value: _event,
        },
        {
          question: "Team number",
          type: "autocomplete",
          //options: [ "option0" , "option1" ],
          required: true,
          value: null,
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
          value: null,
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
          value: null,
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Intake Use:",
          type: "checkbox",
          options: ["Ground", "Station"],
          value: [], // should be an array if it's a checkbox
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Scoring Locations:",
          type: "checkbox",
          options: ["Amp", "Speaker", "Trap", "Hang", "Harmony"],
          value: [], // should be an array if it's a checkbox
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Robot Weight (in pounds)",
          type: "number",
          required: true,
          value: null,
        },
        {
          question:
            "Robot Dimension (Length in Inches) without bumpers - front to back",
          type: "number",
          required: true,
          value: null,
        },
        {
          question:
            "Robot Dimension (Width in Inches) without bumpers - left to right",
          type: "number",
          required: true,
          value: null,
        },
        {
          question:
            "Robot Dimension (Height in Inches) from floor to highest point on robot at the start of the match",
          type: "number",
          required: true,
          value: null,
        },
        {
          question: "Drive Team Members",
          type: "radio",
          options: [
            "One person driving and operating the robot during a match",
          ],
          value: null,
          required: true,
          showOtherInput: false, // show the textarea when first load the page?
        },

        {
          question: "Maneuverability",
          type: "checkbox",
          options: ["Can it drive under the core"],
          value: [], // should be an array if it's a checkbox
          required: false,
          showOtherInput: false, // show the textarea when first load the page?
          otherValue: "", // Store the value of the text input
        },
        {
          question: "Height when fully extended (in inches)",
          type: "number",
          required: true,
          value: null,
        },
        {
          question: "Hours/Weeks of Practice",
          type: "text",
          required: true,
          value: null,
        },
        {
          question: "Additional Comments",
          type: "textarea",
          required: false,
          value: null,
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
        teamNumber: null,
        driveTrainType: null,
        wheelType: null,
        intakeType: [],
        scoringLocations: [],
        robotWeight: null,
        robotDimensionLength: null,
        robotDimensionWidth: null,
        robotDimensionHeight: null,
        maneuverability: [],
        heightWhenFullyExtended: null,
        driveTeamMembers: null,
        practiceHoursPerWeek: null,
        additionalComments: null,
      },
    };
  },

  created() {
    this.restoreFormData();
    // 设置初始状态
    this.savingStatus = 'idle'; // 表示支持自动保存
    this.formModified = false; // 表单未被修改
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
        this.formModified = true; // 表单被修改
        if (this.saveTimeout) {
          clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
          this.savingStatus = 'saving';

          newForm.forEach((question) => {
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
          setTimeout(() => {
            this.savingStatus = 'success';
            this.formModified = false; // 重置表单修改状态，以便再次触发
          }, 1400); // 假设保存操作需要1.4秒
        }, 300); // 用户停止输入300毫秒后开始保存
      },
      deep: true,
    },
  },

  methods: {
    querySearch(queryString, cb) {
      if (queryString.trim().length === 0) {
        cb([]);
        return;
      }

      // 这里替换为你的API URL
      // const apiUrl = `https://scoutify.makesome.cool/teams?query=${queryString}`;
      const apiUrl = `http://localhost:39390/teams?query=${queryString}`;

      axios.get(apiUrl)
        .then(response => {
          // 假设响应数据的格式是 [{tm_number: '1', tm_name: 'The Juggernauts'}, {...}]
          const results = response.data.map(item => ({
            value: `${item.tm_number} - ${item.tm_name}`
          }));
          cb(results);
        })
        .catch(error => {
          console.error('Error during API call:', error);
          cb([]);
        });
    },

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

    // 模拟保存方法，实际应替换为真实的保存逻辑
    async simulateSave() {
      // 模拟异步保存操作
      return new Promise((resolve, reject) => {
        // 模拟保存成功
        resolve();
        // 若需要模拟保存失败，可使用 reject();
      });
    },

    // Will be called before the component is destroyed
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
          this.savingStatus = 'idle';
          this.formModified = false;
        })
        .catch(() => {
          this.$message({
            type: "error",
            message: "Clear Canceled",
          });
        });
    },

    // Reset the form data
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
      // Use SweetAlert2 to create a confirmation dialog
      Swal.fire({
        title: 'Are you sure?',
        text: "It will submit the form once you click the button, and you won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {

          // Check if the form is valid
          this.$refs.form.validate(async (valid) => {
            if (valid) {

              // Update the formData object to include all form fields
              this.formData = {
                Event: this.form.find(item => item.question === "").value,
                Team_Number: this.form.find(item => item.question === "Team number").value,
                Drive_Train_Type: this.form.find(item => item.question === "Type of drive train").value === "other" ? this.form.find(item => item.question === "Type of drive train").otherValue : this.form.find(item => item.question === "Type of drive train").value,
                Wheel_Type: this.form.find(item => item.question === "Type of wheels used").value === "other" ? this.form.find(item => item.question === "Type of wheels used").otherValue : this.form.find(item => item.question === "Type of wheels used").value,
                Intake_Type: this.formatArrayValues(this.form.find(item => item.question === "Intake Use:").value, this.form.find(item => item.question === "Intake Use:").otherValue),
                Scoring_Locations: this.formatArrayValues(this.form.find(item => item.question === "Scoring Locations:").value, this.form.find(item => item.question === "Scoring Locations:").otherValue),
                Robot_Weight: this.form.find(item => item.question === "Robot Weight (in pounds)").value,
                Robot_Length: this.form.find(item => item.question.includes("Length in Inches")).value,
                Robot_Width: this.form.find(item => item.question.includes("Width in Inches")).value,
                Robot_Height: this.form.find(item => item.question.includes("Height in Inches")).value,
                Drive_Team_Members: this.form.find(item => item.question === "Drive Team Members").value === "other" ? this.form.find(item => item.question === "Drive Team Members").otherValue : this.form.find(item => item.question === "Drive Team Members").value,
                Maneuverability: this.formatArrayValues(this.form.find(item => item.question === "Maneuverability").value, this.form.find(item => item.question === "Maneuverability").otherValue),

                Practice_Hours: this.form.find(item => item.question === "Hours/Weeks of Practice").value,
                Additional_Comments: this.form.find(item => item.question === "Additional Comments").value,
                Full_Robot_ImgId: this.fileIds.fullRobot.join(","), // Full Robot Image ID
                Drive_Train_ImgId: this.fileIds.driveTrain.join(",") // Drive Train Image ID
              };

              try {
                await axios.post("https://scoutify.makesome.cool/submit-form", this.formData);

                // Show the success message
                Swal.fire(
                  'Success!',
                  'Form submitted successfully',
                  'success'
                )
                this.$message.success("Form submitted successfully");

                // Clear the form and reset the state
                this.resetFormData();
                this.savingStatus = 'idle'; // Reset the status to default
                this.formModified = false;
              } catch (error) {
                console.error("Error submitting form:", error);
                this.$message.error("Error submitting form");
                this.savingStatus = 'error'; // Update the status to error

                // Show the error message
                Swal.fire(
                  'Error!',
                  'An error occurred while submitting the form',
                  'error'
                )
              }
            }
          });
        }
      });
    },

    resetFormData() {
      // Reset form data logic
      this.form.forEach((question) => {
        question.value = question.type === "checkbox" ? [] : null;
        question.showOtherInput = false;
        question.otherValue = "";
      });
      // Reset other data logic if we wants
    },


    // When the page is loaded and the form data is restored, this method is called to reset the status
    created() {
      this.restoreFormData();
      this.resetFormState(); // Reset the form state when the page is loaded
    },


    // New method: Format array values
    formatArrayValues(arrayValues, otherValue) {
      // If the array contains 'other', then use otherValue to replace, otherwise convert the array to a comma-separated string
      if (arrayValues.includes('other')) {
        return otherValue;
      } else {
        return arrayValues.join(",");
      }
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
        .get(`https://scoutify.makesome.cool/delete?file_ID=${fileId}`)
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
  margin-bottom: 10px;
  padding: 15px 20px;
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

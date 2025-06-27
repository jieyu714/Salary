import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://mdspsmxwitbczvfwzpiu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc3BzbXh3aXRiY3p2Znd6cGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjMwNDUsImV4cCI6MjA2Mjg5OTA0NX0.2sb9ReFc7T2sqjcTGrzPK_til3XcZVNBgcb4UzGegM4'
const supabase = createClient(supabaseUrl, supabaseKey)

let lastMonth = null;
let lastYear = null;
const yearlyData = new Map();
const monthlyData = new Map();
const dailyTimePoint = new Map();
let yearAndMonth = []

let userUUID = ''

function getNowTimeInformation() {
  return Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()).replace(/,/g, '');
}

function showLoading() {
    Swal.fire({
        title: '載入中...',
        html: '請稍候...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading()
        }
    });

    const clickableElements = document.querySelectorAll('button, .clickable-hours');
    clickableElements.forEach(element => {
        element.disabled = true;
    });
}

function hideLoading() {
    Swal.close();

    const clickableElements = document.querySelectorAll('button, .clickable-hours');
    clickableElements.forEach(element => {
        element.disabled = false;
    });
}

function handleButtonClick(event) {
    const target = event.target;

    if (target.classList.contains("year")) {
        if (lastYear !== null) {
            lastYear.classList.remove("clicked");
        }
        target.classList.add("clicked");
        lastYear = target;

        lastMonth = null;
        const monthButtons = document.querySelectorAll('#selection_month button');
        monthButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove("clicked");
        });

        clearTableData();

    } else if (target.classList.contains("month")) {
        if (lastYear === null) return;

        if (lastMonth !== null) {
            lastMonth.classList.remove("clicked");
        }
        target.classList.add("clicked");
        lastMonth = target;
    }

    if (lastYear != null && lastMonth != null) {
        showData();
    }
}

async function importData() {
    showLoading();

    yearlyData.clear();
    monthlyData.clear();
    dailyTimePoint.clear();
    yearAndMonth = [];

    const { data, error } = await supabase
        .from("salaryExistence")
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('資料獲取錯誤:', error);
        return;
    }

    data.forEach(m => {
        if (m.queryable) {
            yearAndMonth.push([m.year, m.month])
        }
    })

    try {
        for (let i = 0; i < yearAndMonth.length; i++) {
            const m = yearAndMonth[i]

            let yearlyFlag = true;
            let yearlyTotalWorkingHours = 0.0;
            let yearlyTotalBasicSalary = 0.0;
            let yearlyTotalOvertimePay = 0.0;
            let yearlyTotalTotalSalary = 0.0;

            if (!yearlyData.has(m[0])) {
                yearlyData.set(m[0], new Map());
            } else {
                yearlyFlag = yearlyData.get(m[0]).get('total')[4]
                yearlyTotalWorkingHours = yearlyData.get(m[0]).get('total')[0]
                yearlyTotalBasicSalary = yearlyData.get(m[0]).get('total')[1]
                yearlyTotalOvertimePay = yearlyData.get(m[0]).get('total')[2]
                yearlyTotalTotalSalary = yearlyData.get(m[0]).get('total')[3]
            }

            let monthlyFlag = true;
            let monthlyTotalWorkingHours = 0.0;
            let monthlyTotalBasicSalary = 0.0;
            let monthlyTotalOvertimePay = 0.0;
            let monthlyTotalTotalSalary = 0.0;

            const { data, error } = await supabase
                .from(`salary${m[0]}${m[1].toLowerCase()}`)
                .select('*')
                .order('dateNumber', { ascending: true });

            if (error) {
                console.error('資料獲取錯誤:', error);
                continue;
            }

            if (!monthlyData.has(`${m[0]}_${m[1]}`)) {
                monthlyData.set(`${m[0]}_${m[1]}`, new Map());
            }

            if (data) {
                for (let d = 0; d < data.length; d++) {

                    const line = data[d];

                    const time = line.dateNumber;
                    const classValue = line.class;
                    const hourlyWage = line.hourlyWage;
                    const workingHours = line.workingHours;
                    const basicSalary = line.basicSalary;
                    const overtimePay = line.overtimePay;
                    const totalSalary = line.totalSalary;
                    const remark = line.remark;
                    const verify = line.verify;
                    const timePointOne = line.timePointOne;
                    const timePointTwo = line.timePointTwo;
                    const timePointThree = line.timePointThree;
                    const timePointFour = line.timePointFour;
                    const holiday = line.publicHoliday;

                    monthlyTotalWorkingHours += workingHours;
                    monthlyTotalBasicSalary += basicSalary;
                    monthlyTotalOvertimePay += overtimePay;
                    monthlyTotalTotalSalary += totalSalary;
                    monthlyFlag &= verify;

                    monthlyData.get(`${m[0]}_${m[1]}`).set(time, [classValue, workingHours, hourlyWage, basicSalary, overtimePay, totalSalary, remark, verify, holiday]);
                    dailyTimePoint.set(`${m[0]}${m[1]}${time}`, [timePointOne, timePointTwo, timePointThree, timePointFour]);
                }
            }


            monthlyData.get(`${m[0]}_${m[1]}`).set("total", ['', monthlyTotalWorkingHours, '', monthlyTotalBasicSalary, monthlyTotalOvertimePay, monthlyTotalTotalSalary, '', monthlyFlag]);
            yearlyData.get(m[0]).set(m[1], [monthlyTotalWorkingHours, monthlyTotalBasicSalary, monthlyTotalOvertimePay, monthlyTotalTotalSalary, monthlyFlag]);

            yearlyTotalWorkingHours += monthlyTotalWorkingHours;
            yearlyTotalBasicSalary += monthlyTotalBasicSalary;
            yearlyTotalOvertimePay += monthlyTotalOvertimePay;
            yearlyTotalTotalSalary += monthlyTotalTotalSalary;
            yearlyFlag &= monthlyFlag;
            yearlyData.get(m[0]).delete('total')
            yearlyData.get(m[0]).set("total", [yearlyTotalWorkingHours, yearlyTotalBasicSalary, yearlyTotalOvertimePay, yearlyTotalTotalSalary, yearlyFlag]);
        }

        if(lastYear != null && lastMonth != null){
            showData();
        }

    } catch (error) {
        console.error("Error during data import:", error);
    } finally {
        hideLoading();
    }
}

async function showData() {
    const dataTable = document.getElementById("show");
    const tableHead = dataTable.querySelector("thead");
    const tableBody = dataTable.querySelector("tbody");
    let htmlContent = '';

    if (lastMonth.textContent == "Annual") {
        const showKey = lastYear.textContent;
        if (!yearlyData.has(showKey)) {
            tableHead.innerHTML = '';
            tableBody.innerHTML = "<div>找不到該年份的資料</div>";
            return;
        }

        tableHead.innerHTML = "<tr><th>Time</th><th>Working Hours</th><th>Basic Salary</th><th>Overtime Pay</th><th>Total Salary</th></tr>";

        for (const [key, value] of yearlyData.get(showKey)) {
            let isBold = value[4] ? '<b>' : '';
            let boldEnd = value[4] ? '</b>' : '';

            let tmp = `<tr>
                        <td>${isBold}${lastYear.textContent} ${key}${boldEnd}</td>
                        <td>${isBold}${value[0]}${boldEnd}</td>
                        <td>${isBold}${value[1]}${boldEnd}</td>
                        <td>${isBold}${value[2]}${boldEnd}</td>
                        <td>${isBold}${value[3]}${boldEnd}</td>
                    </tr>\n`;

            htmlContent += tmp;
        }
    } else {
        const showKey = `${lastYear.textContent}_${lastMonth.textContent}`;
        if (!monthlyData.has(showKey)) {
            tableHead.innerHTML = '';
            tableBody.innerHTML = "<div>找不到該月份的資料</div>";
            return;
        }

        tableHead.innerHTML = "<tr><th>Time</th><th>Class</th><th>Working Hours</th><th>Hourly Wage</th><th>Basic Salary</th><th>Overtime Pay</th><th>Total Salary</th><th>Remark</th></tr>";

        const sortedKeys = Array.from(monthlyData.get(showKey).keys()).sort((a, b) => {
            return a - b;
        });

        for (const key of sortedKeys) {
            const value = monthlyData.get(showKey).get(key);

            let isBold = value[7] ? '<b>' : '';
            let boldEnd = value[7] ? '</b>' : '';

            let tmp = `<tr>
                        <td ${value[0] == 'total' ? '' : "class=\"clickable-time\" "}data-day="${key}" style="cursor: pointer;">${isBold}${lastMonth.textContent} ${key}${boldEnd}</td>
                        <td>${isBold}${value[0]}${boldEnd}</td>
                        <td class="clickable-hours" data-day="${key}" style="cursor: pointer;">${isBold}${value[1]}${boldEnd}</td>
                        <td>${isBold}${value[2]}${boldEnd}</td>
                        <td>${isBold}${value[3]}${boldEnd}</td>
                        <td>${isBold}${value[4]}${boldEnd}</td>
                        <td>${isBold}${value[5]}${boldEnd}</td>
                        <td>${isBold}${value[6]}${boldEnd}</td>
                    </tr>\n`;

            htmlContent += tmp;
        }
    }

    tableBody.innerHTML = htmlContent;

    const clickableHours = document.querySelectorAll('.clickable-hours');
    clickableHours.forEach(cell => {
        cell.addEventListener('click', handleWorkingHoursClick);
    });

    const clickableTime = document.querySelectorAll('.clickable-time');
    clickableTime.forEach(cell => {
        cell.addEventListener('click', handleTimeClick);
    });
}

async function handleWorkingHoursClick(event) {
    let day;
    const target = event.target;

    if (target.tagName === 'B') {
        day = target.parentNode.dataset.day;
    } else {
        day = target.dataset.day;
    }

    const year = lastYear.textContent;
    const month = lastMonth.textContent;

    const timePoints = dailyTimePoint.get(`${year}${month}${day}`);

    displayTimePoints(month, day, timePoints);
}

function displayTimePoints(month, day, timePoints) {
    if (!timePoints) {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: `未找到${month} ${day}的資料`,
        });
        return;
    }

    let popupContent;
    if (timePoints[0] == -1 && timePoints[3] == -1) {
        popupContent = `<p>未上班</p>`
    } else if (timePoints[1] == -1 && timePoints[2] == -1) {
        popupContent = `
        <p><b>上:</b> ${timePoints[0] || 'N/A'}</p>
        <p><b>下:</b> ${timePoints[3] || 'N/A'}</p>
    `;
    } else {
        popupContent = `
        <p><b>上:</b> ${timePoints[0] || 'N/A'}</p>
        <p><b>空:</b> ${timePoints[1] || 'N/A'}</p>
        <p><b>出:</b> ${timePoints[2] || 'N/A'}</p>
        <p><b>下:</b> ${timePoints[3] || 'N/A'}</p>
    `;
    }

    Swal.fire({
        title: `${month} ${day}上班時間表`,
        html: popupContent,
        confirmButtonText: '確認'
    });
}

function getWorkingHours(t1, t2, t3, t4) {
    const ti1 = Math.floor(t1 / 100) + 0.5 * !!(t1 % 100)
    const ti2 = Math.floor(t2 / 100) + 0.5 * !!(t2 % 100)
    const ti3 = Math.floor(t3 / 100) + 0.5 * !!(t3 % 100)
    const ti4 = Math.floor(t4 / 100) + 0.5 * !!(t4 % 100)
    if (t1 == -1) {
        return 0
    } else if (t2 == -1) {
        return ti4 - ti1
    } else {
        return (ti4 - ti3) + (ti2 - ti1)
    }
}

function getBasicSalary(hourlyWage, workingHours, holiday) {
    if (holiday) {
        hourlyWage /= 2
    }
    return Math.min(8, workingHours) * hourlyWage
}

function getOvertimePay(hourlyWage, workingHours, holiday) {
    const partA = Math.max(0, Math.min(2, workingHours - 8)) * hourlyWage * (4.0 / 3)
    const partB = Math.max(0, Math.min(2, workingHours - 10)) * hourlyWage * (5.0 / 3)
    const partC = Math.min(8, workingHours) * (hourlyWage / 2)
    return partA + partB + partC * holiday
}

async function handleTimeClick(event) {
    const td = event.target.closest('.clickable-time');
    if (!td) return;

    const day = td.dataset.day;
    const year = lastYear.textContent;
    const month = lastMonth.textContent;
    const showKey = `${year}_${month}`;
    const data = monthlyData.get(showKey).get(parseInt(day));
    const timePoints = dailyTimePoint.get(`${year}${month}${day}`) || [];

    const { value: formValues } = await Swal.fire({
        title: `${month} ${td.dataset.day} 時間表更改`,
        html: `
            <label>班別：</label>
            <input id="swal-class" class="swal2-input" value="${data[0] || ''}"><br>
            <label>上班：</label>
            <input id="swal-t1" type="number" class="swal2-input" value="${timePoints[0] || ''}"><br>
            <label>空班：</label>
            <input id="swal-t2" type="number" class="swal2-input" value="${timePoints[1] || ''}"><br>
            <label>出班：</label>
            <input id="swal-t3" type="number" class="swal2-input" value="${timePoints[2] || ''}"><br>
            <label>下班：</label>
            <input id="swal-t4" type="number" class="swal2-input" value="${timePoints[3] || ''}"><br>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '確認更改',
        cancelButtonText: '取消',
        preConfirm: () => {
            const t1 = document.getElementById('swal-t1').value
            const t2 = document.getElementById('swal-t2').value
            const t3 = document.getElementById('swal-t3').value
            const t4 = document.getElementById('swal-t4').value
            if (t1 == -1 && t4 == -1 && t2 != -1 && t3 != -1) {
                Swal.showValidationMessage('時間輸入錯誤')
            } else if (((t1 == -1) + (t2 == -1) + (t3 == -1) + (t4 == -1)) % 2) {
                Swal.showValidationMessage('時間輸入錯誤')
            } else if (((t1 == -1) != (t4 == -1)) || ((t2 == -1) != (t3 == -1))) {
                Swal.showValidationMessage('時間輸入錯誤')
            } else if (t1 != -1 && t2 == -1 && t4 <= t1) {
                Swal.showValidationMessage('時間輸入錯誤')
            } else if (t1 != -1 && t2 != -1 && (t4 <= t3 || t3 <= t2 || t2 <= t1)) {
                Swal.showValidationMessage('時間輸入錯誤')
            }
            return {
                classValue: document.getElementById('swal-class').value,
                tp1: t1,
                tp2: t2,
                tp3: t3,
                tp4: t4,
            };
        }
    });

    if (!formValues) return;

    try {
        const { error1 } = await supabase
            .from('salaryInsertInformation')
            .insert([{
                timeInformation: getNowTimeInformation(),
                user_uuid: userUUID,
                targetDate: `${year} ${month} ${day}`,
                originalClass: data[0],
                originalTimePointOne: timePoints[0],
                originalTimePointTwo: timePoints[1],
                originalTimePointThree: timePoints[2],
                originalTimePointFour: timePoints[3],
                changeClass: formValues.classValue,
                changeTimePointOne: formValues.tp1,
                changeTimePointTwo: formValues.tp2,
                changeTimePointThree: formValues.tp3,
                changeTimePointFour: formValues.tp4,
            }]);

        if (error1) {
            console.error('Error inserting data into salaryInsertInformation:', error1);
            Swal.fire({
                icon: 'error',
                title: '錯誤',
                text: '插入薪資變更記錄失敗！',
            });
            return;
        }

        const workingHours = getWorkingHours(parseInt(formValues.tp1), parseInt(formValues.tp2), parseInt(formValues.tp3), parseInt(formValues.tp4))
        const holiday = monthlyData.get(`${year}_${month}`).get(parseInt(day))[8]
        const hourlyWage = monthlyData.get(`${year}_${month}`).get(parseInt(day))[2]
        const basicSalary = getBasicSalary(hourlyWage, workingHours, holiday)
        const overtimePay = getOvertimePay(hourlyWage, workingHours, holiday)
        const totalSalary = basicSalary + overtimePay

        const updateData = {
            class: formValues.classValue,
            "timePointOne": parseInt(formValues.tp1),
            "timePointTwo": parseInt(formValues.tp2),
            "timePointThree": parseInt(formValues.tp3),
            "timePointFour": parseInt(formValues.tp4),
            "workingHours": workingHours,
            "basicSalary": basicSalary,
            "overtimePay": overtimePay,
            "totalSalary": totalSalary,
        };

        const { error: error2 } = await supabase
            .from(`salary${year}${month.toLowerCase()}`)
            .update(updateData)
            .eq('dateNumber', day);

        if (error2) {
            console.error('Error updating data in salary table:', error2);
            Swal.fire({
                icon: 'error',
                title: '錯誤',
                text: '更新薪資資料失敗！',
            });
            return;
        }

        console.log('資料插入成功');
        Swal.fire({
            icon: 'success',
            title: '成功',
            text: '資料更新成功！',
        });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '發生未預期的錯誤！',
        });
        return;
    }

    importData();
}

function clearTableData() {
    const dataTable = document.getElementById("show");
    const tableHead = dataTable.querySelector("thead");
    const tableBody = dataTable.querySelector("tbody");
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
}

async function loginWithEmail(email, password, remember) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('登入失敗：', error.message)
    return false
  }

  userUUID = data.user.id
  console.log('登入成功的UUID:', userUUID)

  if (remember) {
    localStorage.setItem('rememberedEmail', email)
    localStorage.setItem('rememberedUUID', userUUID) 
    localStorage.setItem('rememberedTime', Date.now())
  } else {
    localStorage.removeItem('rememberedEmail')
    localStorage.removeItem('rememberedUUID')
    localStorage.removeItem('rememberedTime')
  }

  return true
}

async function showLoginDialog() {
  while (true) {
    const { value: formValues } = await Swal.fire({
      title: '登入',
      html:
        `<input type="email" id="swal-email" class="swal2-input" placeholder="Email">` +
        `<input type="password" id="swal-password" class="swal2-input" placeholder="Password">` +
        `<label style="display: flex; align-items: center; justify-content: center; margin-top: 10px;">
           <input type="checkbox" id="swal-remember" style="margin-right: 8px;">
           記得我(5天)
         </label>`,
      focusConfirm: false,
      showCancelButton: false,
      confirmButtonText: '登入',
      allowOutsideClick: false,
      preConfirm: () => {
        const email = document.getElementById('swal-email').value.trim()
        const password = document.getElementById('swal-password').value.trim()
        const remember = document.getElementById('swal-remember').checked
        if (!email || !password) {
          Swal.showValidationMessage('請輸入 Email 和密碼')
          return false
        }
        return { email, password, remember }
      }
    })

    if (!formValues) {
      return null
    }

    const loginSuccess = await loginWithEmail(formValues.email, formValues.password, formValues.remember)
    if (loginSuccess) {
      return formValues.email
    } else {
      await Swal.fire({
        icon: 'error',
        title: '登入失敗',
        text: '帳號或密碼錯誤，請重新輸入',
        confirmButtonText: '再試一次'
      })
    }
  }
}

async function logout() {
  localStorage.removeItem('rememberedEmail')
  localStorage.removeItem('rememberedUUID')
  localStorage.removeItem('rememberedTime')

  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('登出錯誤:', error)
  } else {
    location.reload()
  }
}

async function initialization() {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    const rememberedUUID = localStorage.getItem('rememberedUUID')
    const rememberedTime = localStorage.getItem('rememberedTime')

    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000

    if (rememberedEmail && rememberedUUID && rememberedTime) {
        const timeDiff = Date.now() - Number(rememberedTime)
        if (timeDiff <= FIVE_DAYS_MS) {
        console.log(`使用記住的帳號自動登入: ${rememberedEmail}`)
        userUUID = rememberedUUID
        } else {
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberedUUID')
        localStorage.removeItem('rememberedTime')
        const email = await showLoginDialog()
        if (!email) {
            console.log('使用者未登入')
            return
        }
        }
    } else {
        const email = await showLoginDialog()
        if (!email) {
        console.log('使用者未登入')
        return
        }
    }

    importData();

    const monthButtons = document.querySelectorAll('#selection_month button');
    monthButtons.forEach(button => {
        button.disabled = true;
    });

    document.getElementById("selection_year").addEventListener("click", handleButtonClick);
    document.getElementById("selection_month").addEventListener("click", handleButtonClick);

    document.getElementById("logout").addEventListener("click", logout);
    document.getElementById("reload_data").addEventListener("click", importData);
}

document.addEventListener('DOMContentLoaded', () => {
    initialization()
});

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://wpfmthtlyiqungvlixfz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZm10aHRseWlxdW5ndmxpeGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTA5MDAsImV4cCI6MjA2OTAyNjkwMH0.QhSQ-IMrFNJZ5wywKtoZyUzZEDD6T4IW-voe0vIaHSw'
const supabase = createClient(supabaseUrl, supabaseKey)

let lastYear = null
let lastMonth = null
const yearlyData = new Map()
const monthlyData = new Map()
let yearAndMonth = []

function getNowTimeInformation() {
  return Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()).replace(/,/g, '')
}

function showLoading(titleText, htmlText, showConfirmButton) {
    Swal.fire({
        title: titleText,
        html: htmlText,
        allowOutsideClick: false,
        showConfirmButton: showConfirmButton,
        didOpen: () => {
            Swal.showLoading()
        }
    })

    const clickableElements = document.querySelectorAll('button, .clickable-hours')
    clickableElements.forEach(element => {
        element.disabled = true
    })
}

function hideLoading() {
    setTimeout(() => {
        Swal.close()

        const clickableElements = document.querySelectorAll('button, .clickable-hours')
        clickableElements.forEach(element => {
            element.disabled = false
        })
    }, 1000);
    
}

async function importData() {
    showLoading("載入中...", "請稍後...")

    yearlyData.clear()
    monthlyData.clear()
    yearAndMonth = []

    const {data, error} = await supabase
        .from("salaryExistence")
        .select('*')
    
    if (error) {
        console.log("salaryExistence 查詢失敗！")
        return
    }

    data.forEach(m => {
        if (m.queryable) {
            yearAndMonth.push([m.year.toString(), m.month.toString()])
        }
    })

    try {
        for (let i = 0; i < yearAndMonth.length; i++) {
            const m = yearAndMonth[i]

            let yearlyFlag = true
            let yearlyBasicWorkingHours = 0.0
            let yearlyAdditionalWorkingHours = 0.0
            let yearlyTotalWorkingHours = 0.0
            let yearlyTotalBasicSalary = 0.0
            let yearlyTotalOvertimePay = 0.0
            let yearlyTotalTotalSalary = 0.0

            if (!yearlyData.has(m[0])) {
                yearlyData.set(m[0], new Map())

            } else {
                yearlyFlag = yearlyData.get(m[0]).get('total')[4]
                yearlyBasicWorkingHours = yearlyData.get(m[0]).get('total')[0]
                yearlyAdditionalWorkingHours = yearlyData.get(m[0]).get('total')[1]
                yearlyTotalWorkingHours = yearlyData.get(m[0]).get('total')[2]
                yearlyTotalBasicSalary = yearlyData.get(m[0]).get('total')[3]
                yearlyTotalOvertimePay = yearlyData.get(m[0]).get('total')[4]
                yearlyTotalTotalSalary = yearlyData.get(m[0]).get('total')[5]
            }

            let monthlyFlag = true
            let monthlyBasicWorkingHours = 0.0
            let monthlyAdditionalWorkingHours = 0.0
            let monthlyTotalWorkingHours = 0.0
            let monthlyTotalBasicSalary = 0.0
            let monthlyTotalOvertimePay = 0.0
            let monthlyTotalTotalSalary = 0.0

            const {data, error} = await supabase
                .from("salary")
                .select('*')
                .eq("year", m[0])
                .eq("month", m[1])

            if (error) {
                console.log(`salary table ${m[0]} ${m[1]} 查詢失敗！`)
                break
            }

            if (!monthlyData.has(`${m[0]}_${m[1]}`)) {
                monthlyData.set(`${m[0]}_${m[1]}`, new Map())
            }

            if (data) {
                for (let d = 0; d < data.length; d++) {

                    const line = data[d]

                    const time = line.day
                    const company = line.company
                    const branch = line.branch
                    const companyBranch = company + ' ' + branch
                    const classValue = line.class
                    const isDoubleSalary = line.isDoubleSalary
                    const hourlyWage = line.hourlyWage
                    const startShift = line.startShift
                    const offDuty = line.offDuty
                    const secondShift = line.secondShift
                    const endShift = line.endShift
                    const basicWorkingHours = line.basicWorkingHours
                    const additionalWorkingHours = line.additionalWorkingHours
                    const reason = line.reason
                    const totalWorkingHours = line.totalWorkingHours
                    const basicSalary = line.basicSalary
                    const overtimePay = line.overtimePay
                    const totalSalary = line.totalSalary
                    const remark = line.remark
                    const verify = line.verify

                    monthlyBasicWorkingHours += basicWorkingHours
                    monthlyAdditionalWorkingHours += additionalWorkingHours
                    monthlyTotalWorkingHours += totalWorkingHours
                    monthlyTotalBasicSalary += basicSalary
                    monthlyTotalOvertimePay += overtimePay
                    monthlyTotalTotalSalary += totalSalary
                    monthlyFlag &= verify

                    monthlyData.get(`${m[0]}_${m[1]}`).set(time.toString(), [companyBranch, classValue, isDoubleSalary, hourlyWage, startShift, offDuty, secondShift, endShift, basicWorkingHours, additionalWorkingHours, reason, totalWorkingHours, basicSalary, overtimePay, totalSalary, remark, verify])
                }
            }


            monthlyData.get(`${m[0]}_${m[1]}`).set("total", ['', '', '', '', '', '', '', '', monthlyBasicWorkingHours, monthlyAdditionalWorkingHours, '', monthlyTotalWorkingHours, monthlyTotalBasicSalary, monthlyTotalOvertimePay, monthlyTotalTotalSalary, '', monthlyFlag])
            yearlyData.get(m[0]).set(m[1], [monthlyBasicWorkingHours, monthlyAdditionalWorkingHours, monthlyTotalWorkingHours, monthlyTotalBasicSalary, monthlyTotalOvertimePay, monthlyTotalTotalSalary, monthlyFlag])

            yearlyBasicWorkingHours += monthlyBasicWorkingHours
            yearlyAdditionalWorkingHours += monthlyAdditionalWorkingHours
            yearlyTotalWorkingHours += monthlyTotalWorkingHours
            yearlyTotalBasicSalary += monthlyTotalBasicSalary
            yearlyTotalOvertimePay += monthlyTotalOvertimePay
            yearlyTotalTotalSalary += monthlyTotalTotalSalary
            yearlyFlag &= monthlyFlag
            yearlyData.get(m[0]).delete('total')
            yearlyData.get(m[0]).set("total", [yearlyBasicWorkingHours, yearlyAdditionalWorkingHours, yearlyTotalWorkingHours, yearlyTotalBasicSalary, yearlyTotalOvertimePay, yearlyTotalTotalSalary, yearlyFlag])
        }

        if(lastYear != null && lastMonth != null){
            showData()
        }

    } catch (error) {
        console.error("Error during data import:", error)
    } finally {
        hideLoading()
    }
}

async function showData() {
    const dataTable = document.getElementById("show")
    const tableHead = dataTable.querySelector("thead")
    const tableBody = dataTable.querySelector("tbody")
    let htmlContent = ''

    if (lastMonth.textContent == "Annual") {
        const showKey = lastYear.textContent

        if (!yearlyData.has(showKey)) {
            tableHead.innerHTML = ''
            tableBody.innerHTML = "<div>找不到該年份的資料</div>"
            return
        }

        tableHead.innerHTML = "<tr><th>Time</th><th>Basic Working Hours</th><th>Additional Working Hours</th><th>Working Hours</th><th>Basic Salary</th><th>Overtime Pay</th><th>Total Salary</th></tr>"

        for (const [key, value] of yearlyData.get(showKey)) {
            let isBold = (value[6] ? "<b>" : '')
            let boldEnd = (value[6] ? "</b>" : '')

            let tmp = `<tr>
                        <td>${isBold}${lastYear.textContent} ${key}${boldEnd}</td>
                        <td>${isBold}${value[0]}${boldEnd}</td>
                        <td>${isBold}${value[1]}${boldEnd}</td>
                        <td>${isBold}${value[2]}${boldEnd}</td>
                        <td>${isBold}${value[3]}${boldEnd}</td>
                        <td>${isBold}${value[4]}${boldEnd}</td>
                        <td>${isBold}${value[5]}${boldEnd}</td>
                    </tr>\n`

            htmlContent += tmp
        }
    } else {
        const showKey = `${lastYear.textContent}_${lastMonth.textContent}`
        if (!monthlyData.has(showKey)) {
            tableHead.innerHTML = ''
            tableBody.innerHTML = "<div>找不到該月份的資料</div>"
            return
        }

        tableHead.innerHTML = "<tr><th>Time</th><th>Company Branch</th><th>Class</th><th>Working Hours</th><th>Hourly Wage</th><th>Total Salary</th><th>Remark</th></tr>"

        const sortedKeys = Array.from(monthlyData.get(showKey).keys()).sort((a, b) => {
            return a - b
        })

        for (const key of sortedKeys) {
            const value = monthlyData.get(showKey).get(key)

            let isBold = value[16] ? "<b>" : ''
            let boldEnd = value[16] ? "</b>" : ''

            let tmp = `<tr>
                        <td ${key == "total" ? '' : "class=\"clickableTime\" "}data-day="${key}" style="cursor: pointer">${isBold}${lastMonth.textContent} ${key}${boldEnd}</td>
                        <td>${isBold}${value[0]}${boldEnd}</td>
                        <td>${isBold}${value[1]}${boldEnd}</td>
                        <td class=clickableWorkingHours data-day="${key}" style="cursor: pointer">${isBold}${value[11]}${boldEnd}</td>
                        <td>${isBold}${value[3] * (value[2] ? 2 : 1)}${boldEnd}</td>
                        <td class=clickableTotalSalary data-day="${key}" style="cursor: pointer">${isBold}${value[14]}${boldEnd}</td>
                        <td ${key == "total" ? '' : "class=\"clickableRemark\" "}data-day="${key}" style="cursor: pointer">${isBold}${value[15]}${boldEnd}</td>
                    </tr>\n`

            htmlContent += tmp
        }
    }

    tableBody.innerHTML = htmlContent
    const clickableTime = document.querySelectorAll('.clickableTime')
        clickableTime.forEach(cell => {
            cell.addEventListener('click', handleTimeClick)
        })

    const clickableWorkingHours = document.querySelectorAll('.clickableWorkingHours')
    clickableWorkingHours.forEach(cell => {
        cell.addEventListener('click', handleYearlyWorkingHoursClick)
    })

    const clickableTotalSalary = document.querySelectorAll('.clickableTotalSalary')
    clickableTotalSalary.forEach(cell => {
        cell.addEventListener('click', handleTotalSalaryClick)
    })

    const clickableRemark = document.querySelectorAll('.clickableRemark')
    clickableRemark.forEach(cell => {
        cell.addEventListener('click', handleRemarkClick)
    })
}

async function handleTimeClick(event) {
    const td = event.target.closest('.clickableTime')
    if (!td) return

    const day = td.dataset.day
    const year = lastYear.textContent
    const month = lastMonth.textContent
    const showKey = `${year}_${month}`
    const data = monthlyData.get(showKey).get(day)

    const { value: formValues } = await Swal.fire({
        title: `${month} ${td.dataset.day} 上班時間表`,
        html: `
            <label>班別：</label>
            <input id="swalClass" class="swal2-input" value="${data[1]}"><br>
            <label>上班：</label>
            <input id="swalT1" type="number" class="swal2-input" value="${data[4] || ''}"><br>
            <label>空班：</label>
            <input id="swalT2" type="number" class="swal2-input" value="${data[5] || ''}"><br>
            <label>出班：</label>
            <input id="swalT3" type="number" class="swal2-input" value="${data[6] || ''}"><br>
            <label>下班：</label>
            <input id="swalT4" type="number" class="swal2-input" value="${data[7] || ''}"><br>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '更改',
        cancelButtonText: '取消',
        preConfirm: () => {
            const t1 = document.getElementById('swalT1').value
            const t2 = document.getElementById('swalT2').value
            const t3 = document.getElementById('swalT3').value
            const t4 = document.getElementById('swalT4').value
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
                classValue: document.getElementById('swalClass').value,
                tp1: t1,
                tp2: t2,
                tp3: t3,
                tp4: t4,
            }
        }
    })

    if (!formValues) return
    const {error} = await supabase
        .from("salary")
        .update({class: formValues.classValue, startShift: parseInt(formValues.tp1), offDuty: parseInt(formValues.tp2), secondShift: parseInt(formValues.tp3), endShift: formValues.tp4})
        .eq("year", year)
        .eq("month", month)
        .eq("day", day)

    if (error) {
        console.error('An unexpected error occurred:', error)
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '發生未預期的錯誤！',
        })
    } else {
        await importData()
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: '成功',
                text: `成功更改 ${year} ${month} ${day} 時間表`,
            }) 
        }, 1100);
    }
}

async function handleYearlyWorkingHoursClick(event) {
    let day
    const target = event.target

    if (target.tagName === 'B') {
        day = target.parentNode.dataset.day
    } else {
        day = target.dataset.day
    }

    const year = lastYear.textContent
    const month = lastMonth.textContent

    const data = monthlyData.get(`${year}_${month}`).get(day)
    if (!data[11]) {
        Swal.fire({
            title: `${month} ${day} 時數表`,
            html: "<p>未上班</p>",
            confirmButtonText: "確認",
        })
    } else {
        let popupContent
        if (day != "total") {
            popupContent = `
                <label><b>上班時數:</b></label>
                <input disabled class="swal2-input" value="${data[8]}"><br>
                <label><b>額外時數:</b></label>
                <input id="swalAdditionalWorkingHours" type="number" class="swal2-input" value="${data[9]}"><br>
                <label><b>　注釋　:</b></label>
                <input ${day == "total" ? "disabled" : ''} id="swalReason" type="text" class="swal2-input" value="${data[10]}"><br>
            `
        } else {
            popupContent = `
                <label><b>上班時數:</b></label>
                <input disabled class="swal2-input" value="${data[8]}"><br>
                <label><b>額外時數:</b></label>
                <input disabled id="swalAdditionalWorkingHours" type="number" class="swal2-input" value="${data[9]}"><br>
            `
        }

        const {value: formValues} = await Swal.fire({
            title: `${month} ${day} 時數表`,
            html: popupContent,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "更改",
            cancelButtonText: "取消",
            preConfirm: () => {
                const additionalWorkingHours = parseFloat(document.getElementById("swalAdditionalWorkingHours").value)
                const reason = document.getElementById('swalReason').value
                if (additionalWorkingHours && !reason) {
                    Swal.showValidationMessage("請輸入額外時數獲得原因")
                } else if (!additionalWorkingHours && reason) {
                    Swal.showValidationMessage("請輸入額外時數之值")
                }
                return {
                    additionalWorkingHours: document.getElementById("swalAdditionalWorkingHours").value,
                    reason: document.getElementById("swalReason").value
                }
            },
        })

        if (!formValues) return

        const {error} = await supabase
            .from("salary")
            .update({additionalWorkingHours: parseFloat(formValues.additionalWorkingHours), reason: formValues.reason})
            .eq("year", year)
            .eq("month", month)
            .eq("day", day)

        if (error) {
            console.error('An unexpected error occurred:', error)
            Swal.fire({
                icon: 'error',
                title: '錯誤',
                text: '發生未預期的錯誤！',
            })
        } else {
            await importData()
            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: '成功',
                    text: `成功更改 ${year} ${month} ${day} 時數！`,
                })
            }, 1100);
        }
    }
}

async function handleTotalSalaryClick(event) {
    let day
    const target = event.target

    if (target.tagName === 'B') {
        day = target.parentNode.dataset.day
    } else {
        day = target.dataset.day
    }

    const year = lastYear.textContent
    const month = lastMonth.textContent

    const data = monthlyData.get(`${year}_${month}`).get(day)

    let popupContent
    if (!data[11]) {
        popupContent = "<p>未上班</p>"
    } else {
        popupContent = `
            <label><b>基本薪資:</b></label>
            <input disabled class="swal2-input" value="${data[12]}"><br>
            <label><b>加班薪資:</b></label>
            <input disabled class="swal2-input" value="${data[13]}"><br>
        ` 
    }
    Swal.fire({
        title: `${month} ${day} 薪資表`,
        html: popupContent,
        confirmButtonText: "確定"
    })
}

async function handleRemarkClick(event) {
    let day
    const target = event.target

    if (target.tagName === 'B') {
        day = target.parentNode.dataset.day
    } else {
        day = target.dataset.day
    }

    const year = lastYear.textContent
    const month = lastMonth.textContent
    const verify = monthlyData.get(`${year}_${month}`).get(day)[16]

    const {value: formValues} = await Swal.fire({
        title: `${month} ${day} 備註、確認狀態`,
        html: `
            <label style="text-align: left">　備註　:</label>
            <input type="text" id="swalRemark" class="swal2-input" value="${target.textContent}">
            
            <br>
            <label style="text-align: left">確認狀態:</label>
            <input type="text" id="swalVerify" class="swal2-input" style="text-align: center width: 10ch" value=${verify ? "已確認" : "尚未確認"} readonly>
        `,
        showCancelButton: true,
        confirmButtonText: "確認",
        cancelButtonText: "取消",
        didOpen: () => {
            const verifyInput = document.getElementById('swalVerify')

            verifyInput.addEventListener("mousedown", (event) => {
                event.preventDefault()
                verifyInput.value = verifyInput.value === "已確認" ? "尚未確認" : "已確認"
            })
        },
        preConfirm: () => {
            const verify = (document.getElementById("swalVerify").value == "已確認" ? true : false)
            return {
                remark: document.getElementById("swalRemark").value,
                verify: verify
            }
        }
    })

    if (!formValues) return

    const {error} = await supabase
        .from("salary")
        .update({remark: formValues.remark, verify: formValues.verify})
        .eq("year", year)
        .eq("month", month)
        .eq("day", day)

    if (error) {
        console.error('An unexpected error occurred:', error)
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '發生未預期的錯誤！',
        })
    } else {
        await importData()
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: '成功',
                text: `成功更改 ${year} ${month} ${day} 註釋、核對項`,
            })
        }, 1100);
            
    }
}

function clearTableData() {
    const dataTable = document.getElementById("show")
    dataTable.querySelector("thead").innerHTML = ''
    dataTable.querySelector("tbody").innerHTML = ''
}

function handleButtonClick(event) {
    const target = event.target

    if (target.classList.contains("year")) {
        if (lastYear !== null) {
            lastYear.classList.remove("clicked")
        }
        target.classList.add("clicked")
        lastYear = target

        lastMonth = null
        const monthButtons = document.querySelectorAll('#selection_month button')
        monthButtons.forEach(button => {
            button.disabled = false
            button.classList.remove("clicked")
        })

        clearTableData()
    } else if (target.classList.contains("month")) {
        if (lastYear === null) return

        if (lastMonth != null) {
            lastMonth.classList.remove("clicked")
        }
        target.classList.add("clicked")
        lastMonth = target

        showData()
    }
}

document.addEventListener("DOMContentLoaded", () => {

    importData()

    const monthButtons = document.querySelectorAll('#selection_month button')
    monthButtons.forEach(button => {
        button.disabled = true
    })

    document.getElementById("selection_year").addEventListener("click", handleButtonClick)
    document.getElementById("selection_month").addEventListener("click", handleButtonClick)
    document.getElementById("reload_data").addEventListener("click", importData)
})

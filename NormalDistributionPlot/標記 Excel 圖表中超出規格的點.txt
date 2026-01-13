Sub HighlightDataPointsInColumnE()
    Dim ws As Worksheet
    Dim chtObj As ChartObject
    Dim ser As Series
    Dim i As Integer
    Dim vals As Variant
    Dim USL As Variant, LSL As Variant
    
    ' 遍歷所有工作表
    For Each ws In ThisWorkbook.Worksheets
        
        ' 1. 從每張表的 D2 和 C2 取得規格
        USL = ws.Range("D2").Value
        LSL = ws.Range("C2").Value
        
        ' 檢查規格是否為數字，若不是則跳過該工作表
        If Not (IsNumeric(USL) And IsNumeric(LSL)) Then GoTo NextSheet

        ' 2. 遍歷工作表中的圖表
        For Each chtObj In ws.ChartObjects
            For Each ser In chtObj.Chart.SeriesCollection
                
                ' 3. 關鍵判斷：檢查數列的公式是否引用了 E 欄
                ' 數列公式格式通常為 =SERIES(名稱, X軸範圍, Y軸範圍, 順序)
                ' 我們檢查公式中是否包含 "$E"
                If InStr(ser.Formula, "$E") > 0 Then
                    
                    ' 這是數據點數列，執行變色邏輯
                    vals = ser.Values
                    
                    ' 確保點標記是顯示的
                    ser.MarkerStyle = xlMarkerStyleAutomatic
                    
                    For i = 1 To UBound(vals)
                        If IsNumeric(vals(i)) Then
                            If vals(i) > USL Then
                                ' 超出上限 (D2)：變紅色
                                With ser.Points(i)
                                    .MarkerBackgroundColor = RGB(255, 0, 0)
                                    .MarkerForegroundColor = RGB(255, 0, 0)
                                    .MarkerSize = 7
                                End With
                            ElseIf vals(i) < LSL Then
                                ' 低於下限 (C2)：變橘色
                                With ser.Points(i)
                                    .MarkerBackgroundColor = RGB(255, 0, 0)
                                    .MarkerForegroundColor = RGB(255, 0, 0)
                                    .MarkerSize = 7
                                End With
                            Else
                                ' 規格內：變藍色（或你想要的任何正常顏色）
                                With ser.Points(i)
                                    .MarkerBackgroundColor = RGB(0, 112, 192)
                                    .MarkerForegroundColor = RGB(0, 112, 192)
                                    .MarkerSize = 5
                                End With
                            End If
                        End If
                    Next i
                    
                Else
                    ' 這不是 E 欄的數據（可能是規格線或目標線），不做任何變更
                    ' 原有的線段顏色、標記樣式都會被完整保留
                End If
                
            Next ser
        Next chtObj
        
NextSheet:
    Next ws
    
    MsgBox "更新完成！" & vbCrLf & "已自動標記所有引用 E 欄的數據點，其餘線段保持不變。", vbInformation
End Sub
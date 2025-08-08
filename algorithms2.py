def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j =  -1
        while j >= 0 and arr[j] >key:
            arr[j+1]=arr[j]
            j-=1
        arr[j+1] = key 
    return arr


#Example
arr = [64, 32, 25, 12, 22, 11, 90]
print("Original array:", arr)       
print("Sorted array:", insertion_sort(arr))
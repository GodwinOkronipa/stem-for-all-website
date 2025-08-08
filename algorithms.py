xl = int(1)
xu = int(3)
xm = int(xl+xu/2)
yl = xl -2
yu = xu -2
ym = xm -2
whil xl*xm != 0:
    if xl*xm < 0:
        xu == xm
        print(f"New Xu = {xm}")
    elif xl*xm > 0:
         xl == xm
         print(f"New xm is  {xm}")     
    elif xl*xm == 0:
        print(f"You seek {xm}")
 

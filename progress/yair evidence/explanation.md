==============
circuit design
==============

For the initial 2D circuit, we needed to check the voltage and see how they worked. Because of our choice of batteries, we needed a PMU to manage our volatge levels through severe voltage variance. To do this we got the AP2112K 3.3V LDO to help manage that. 

In the circuit layout you can see how all the components are wired and very few resistance is added outside of the wires themselves. There was a minor miscacluation made by the circuit modelling software which is more evident in the Monte Carlo simulation than the DC operating pt. In the DC operating pt, we see N1, N2, N4, N5 all get the voktage we need them to get (5V, 3.7V, 3.7V and 3.3V) which N3 gets a negative voltage. this is a miscalculation as N3 shoul be recieving 0 volts. However we do notice that the voltage is so incredkbly close to 0, we can estimate it to be equal. In the monte carlo sim you can see a similar thing happing on N3. Luckily the same rule applies and we can round up to 0V making our first beacon circuit design perfect.
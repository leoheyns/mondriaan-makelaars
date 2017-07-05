<?php 
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT Type FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>

<form action="HuisIDscript_b.php" method="post">
Kies een pandtype:<br />
<select name="panden">

<?php
while(list($Type) = mysql_fetch_row($resultaat))
{
print("<option value='$Type'>$Type</option>");
}
?> 
</select><br />


<input type="submit" value="Verzend" />
</form>
